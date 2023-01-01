// @ts-check
'use strict';

const {
  system: { SmspubliReport },
  intranet: { GfInvoiceInvoice, GfClient, UnpaidInvoice, UnpaidNotification },
} = require('@models');

const {
  respondBadRequest,
  respondCreated,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const {
  getAllEntities,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const { Unpaid001 } = require('@utils/exceptions').ExceptionsCode;

const UnpaidInvoiceService = require('./UnpaidInvoiceService');
const UnpaidTemplateService = require('./UnpaidTemplateService');

const _ = require('lodash');
const moment = require('moment');
const { Op, col } = require('sequelize');
const assert = require('assert');

/**
 *
 * delete a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteUnpaidNotificationsId = async function (id) {
  return findAndDelete(id, UnpaidNotification);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getUnpaidNotifications = async function (query) {
  return getAllEntities(query, UnpaidNotification, undefined, [
    { model: SmspubliReport, as: 'provider_message' },
    { model: GfClient, as: 'client' },
  ]);
};

/**
 * Your GET endpoint
 * get single basic information record by id
 *
 * id String
 * returns Object
 **/
exports.getUnpaidNotificationsId = async function (id) {
  return findAndGet(id, UnpaidNotification);
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUnpaidNotifications = async function (body) {
  return respondCreated(await UnpaidNotification.create(body));
};

/**
 *
 * update a basic information record by id
 *
 * id String
 * body Body in this example we want to change the
 * department of employee's basic information (optional)
 * returns Object
 **/
exports.putUnpaidNotificationsId = async function (id, body) {
  return findAndUpdate(id, body, UnpaidNotification);
};

/**
 * Fix wrong client notifications for current month unpaid invoices.
 *
 * Logic:
 *  - Work ONLY with unpaid_invoices.
 *  - For each UnpaidInvoice in the current month:
 *      * Find active notifications in unpaid_notifications (status = 1)
 *      * If ANY notification.client_id === unpaidInvoice.client_id → skip
 *      * Else:
 *          - Set status = 0 for all notifications of that invoice
 *          - Generate fresh notifications via generateNotificationsBaseOnPeriods
 *
 * @param {Object} user - current user (for audit, passed down to generator)
 * @returns {Promise<{fixed: Array, skipped: Array}>}
 */
exports.fixCurrentMonthUnpaidNotifications = async (user) => {
  // Change `date` to the correct field if needed
  const unpaidInvoices = await UnpaidInvoice.findAll({
    include: [
      {
        model: UnpaidNotification,
        as: 'notifications',
        required: true,
        where: {
          status: 1,
          client_id: {
            [Op.ne]: col('UnpaidInvoice.client_id'),
          },
        },
      },
    ],
  });

  const fixed = [];
  const skipped = [];

  for (const unpaidInvoice of unpaidInvoices) {
    // IMPORTANT:
    // Here I assume `unpaidInvoice.invoice_id` is the value stored in UnpaidNotification.invoice_id
    // and is also the one used by generateNotificationsBaseOnPeriods.
    const unpaid_invoice_id = unpaidInvoice.id;

    // 2) Find active notifications for this invoice
    const notifications = await UnpaidNotification.findAll({
      where: {
        invoice_id: unpaid_invoice_id,
      },
    });

    if (!notifications.length) {
      // You said: only care about regenerating when existing notifications are wrong.
      // If there are no notifications, just skip.
      continue;
    }

    // 3) Check if any notification already has the correct client_id
    const hasCorrectClient = notifications.some(
      (notif) => notif.client_id === unpaidInvoice.client_id,
    );

    if (hasCorrectClient) {
      // At least one notification is correct -> ignore / skip regeneration
      skipped.push({
        invoice_id: unpaidInvoice.invoice_id,
        unpaid_invoice_id: unpaidInvoice.id,
        client_id: unpaidInvoice.client_id,
      });
      continue;
    }

    // 4) Mark existing notifications as inactive (status = 0)
    await UnpaidNotification.update(
      { status: 0 },
      {
        where: {
          invoice_id: unpaid_invoice_id,
        },
      },
    );

    // 5) Build data ONLY from unpaid_invoice row
    const phone = await UnpaidInvoiceService.getClientPhone(
      unpaidInvoice.client_id,
    );

    const plainUnpaidInvoice = {
      ...unpaidInvoice.get({ plain: true }),
      send_method: unpaidInvoice.send_method,
      phone,
      invoice_id: unpaid_invoice_id,
    };

    // If send_method was null in DB but exists in some notification, fallback:
    if (!plainUnpaidInvoice.send_method && notifications[0]) {
      plainUnpaidInvoice.send_method = notifications[0].send_method;
    }

    // 6) Generate new notifications using your existing generator
    const regenerated = await exports.generateNotificationsBaseOnPeriods(
      unpaidInvoice.invoice_id,
      plainUnpaidInvoice,
      user,
    );

    fixed.push({
      invoice_id: unpaidInvoice.invoice_id,
      unpaid_invoice_id: unpaidInvoice.id,
      client_id: unpaidInvoice.client_id,
      regenerated_count: Array.isArray(regenerated) ? regenerated.length : 0,
    });
  }

  return {
    fixed,
    skipped,
  };
};

exports.generateNotificationsBaseOnPeriods = async (invoice_id, data, user) => {
  const { msg_period: days, msgs_per_period: steps, msg_hour: hours } = data;
  if (steps > days) {
    return;
  }
  const result = [];
  const hour = moment(hours);
  const res = Math.floor(days / steps);

  async function create(day) {
    data.send_date = moment()
      .startOf('day')
      .add(day, 'days')
      .add(parseInt(hour.format('H')), 'hours')
      .format('YYYY-MM-DD HH:mm:ss');
    const newNotif = await exports.createNewNotification(
      invoice_id,
      data,
      user,
    );
    result.push(newNotif);
  }

  await create(1);

  for (let i = 1; i < steps; i++) {
    await create(i * res);
  }

  return result;
};

/**
 *
 * @param {Object} notification
 * @param {String} type  sms|whatsapp|telegram
 * @returns Notification
 */
exports.cloneNotification = async (notification, type) => {
  // let notif = await exports.getUnpaidNotificationsId(notification.id);
  const unpaid_invoice = await findAndGet(
    notification.invoice_id,
    UnpaidInvoice,
    false,
    true,
    true,
  );

  //find invoice by invoice code from invoice_invoices table of intranet
  const invoice = await GfInvoiceInvoice.findOne({
    where: {
      code: unpaid_invoice.invoice_code,
      //status:1
    },
  });
  assert(invoice);

  //find related client from gf_clients table of intranet
  const client = await GfClient.findOne({
    where: {
      invoiceClientId: invoice.clientId,
    },
  });
  assert(client);

  //check for template type and if not exist return undefined
  const template = await UnpaidTemplateService.getUnpaidTemplateByName(type);
  if (!template) {
    throw Unpaid001(type);
  }

  //merge all unpaid invoice and notification and template to generate message
  //for template
  const data = {
    ...unpaid_invoice,
    ...notification,
    template,
  };
  const gen_template = UnpaidTemplateService.renderWithInvoiceData(
    invoice,
    data,
  );

  //create new message payload
  const notification_payload = {
    invoice_id: notification.invoice_id,
    client_id: client.id,
    to: notification.to,
    message: gen_template,
    send_status: 'pending',
    send_date: data.send_date,
    send_method: type,
    created_by_retry: !!notification.created_by_retry,
  };

  //return created message
  try {
    return await UnpaidNotification.create(notification_payload);
  } catch (e) {
    console.error(e);
  }
};

exports.createNewNotification = async (invoice_id, data, user) => {
  const invoice = await GfInvoiceInvoice.findOne({
    where: {
      id: invoice_id,
      //status:1
    },
  });

  const client = await GfClient.findOne({
    where: {
      invoiceClientId: invoice.clientId,
    },
  });

  // check data is change or no
  data = await exports.setSendTo(client, data, user);
  const template = UnpaidTemplateService.renderWithInvoiceData(invoice, data);

  const notification_payload = {
    invoice_id: data.invoice_id,
    client_id: client.id,
    to: JSON.stringify(data.to),
    message: template,
    send_status: 'pending',
    send_date: data.send_date,
    send_method: data.send_method,
    status: 1,
    uid: 90,
  };

  return UnpaidNotification.create(notification_payload);
};

exports.setSendTo = async (client, data, user) => {
  const phone = await UnpaidInvoiceService.getClientPhone(client.id);

  if (_.isUndefined(data.to) || _.isNull(data.to) || data.to.length < 4) {
    switch (data.send_method) {
      case 'email':
        data.to = {
          id: client.id,
          email:
            _.isUndefined(client.emailAddress) || _.isNull(client.emailAddress)
              ? ''
              : client.emailAddress,
        };
        break;
      case 'telegram':
      case 'sms':
      case 'whatsapp':
        data.to = {
          id: client.id,
          number: phone,
        };
        break;
      default:
        data.to = {
          id: client.id,
          number: '',
          email: phone,
        };
        break;
    }
  }
  return data;
};

//this function user by scheduler
exports.sendNotifications = async () => {
  const pendingNotifications = await getPendingNotificationsBetweenTimes(
    moment().format('YYYY-MM-DD HH:mm:ss'),
    moment().add(1, 'hours').format('YYYY-MM-DD HH:mm:ss'),
  );
  const toNotificate = [];

  for (const pendingNotification of pendingNotifications) {
    const invoice = await GfInvoiceInvoice.findByPk(
      pendingNotification.invoice_id,
    );
    if (
      _.isNull(invoice) ||
      _.isNull(pendingNotification.send_method) ||
      invoice.state === 'paid'
    ) {
      continue;
    }

    const client = await GfClient.findByPk(pendingNotification.client_id);
    if (_.isNull(client)) {
      return respondBadRequest(
        `client with id: ${pendingNotification.client_id} not found!`,
      );
    }

    toNotificate.push({
      notification_id: pendingNotification.id,
      invoice_id: pendingNotification.invoice_id,
      client_id: client.id,
      send_method: pendingNotification.send_method,
      message: pendingNotification.message,
      receiver:
        !_.isNull(client.phone) && !_.isUndefined(client.phone)
          ? client.phone
          : pendingNotification.to,
    });
  }

  //event(new NotifiyGroupOfClientsEvent($toNotificate));

  return {
    notifications_to_sent: toNotificate,
    intents_total: toNotificate.length,
  };
};

const getPendingNotificationsBetweenTimes = async (start, end) => {
  return await UnpaidNotification.findAll({
    where: {
      send_date: {
        [Op.between]: [start, end],
      },
      send_status: 'pending',
      status: 1,
    },
  });
};

// const updateStatusNotificationAfterSent = async (notificationId, newStatus) => {
//   if (["sent", "pending", "error", "cancel"].includes(newStatus)) {
//     return respondBadRequest(`Invalid Status. Take one of: 'sent', 'pending', 'error', 'cancel'.`);
//   }

//   const notification = await UnpaidNotification.findByPk(notificationId);

//   if (_.isNull(notification)) {
//     return respondBadRequest(`There's not any Notification with id ${id}`);
//   }

//   notification.send_status = newStatus;
//   await notification.save();

//   const unpaidInvoice = await UnpaidInvoice.findByPk(notification.invoice_id);
//   const client = await GfClient.findByPk(notification.client_id);

//   const dataForUnpaidTypeHistory = {
//     clientName: client.name,
//     phone: await UnpaidInvoiceService.getClientPhone(client.id),
//     sendDate: notification.send_date,
//     msgPeriod: unpaidInvoice.msg_period,
//     msgHour: moment(unpaidInvoice.msg_hour).format("H"),
//   };

//   saveTaskForNotify({
//       id: unpaidInvoice.invoice_id
//     },
//     dataForUnpaidTypeHistory,
//     "sms",
//     null,
//     unpaidInvoice
//   );
// };

exports.generateNotificationTextMessage = async function (templateName, body) {
  const { invoice_code, ...rest } = body;

  let data = {
    ...rest,
  };

  const template = await UnpaidTemplateService.getUnpaidTemplateByName(
    templateName,
  );
  if (template === '') {
    return respondNotFound('template not found');
  }

  const invoice_invoice = await GfInvoiceInvoice.findOne({
    where: {
      code: invoice_code,
    },
  });
  if (_.isNull(invoice_invoice)) {
    return respondNotFound('invoice with this invoice code not found');
  }

  const client = await GfClient.findOne({
    where: {
      invoiceClientId: invoice_invoice.clientId,
    },
  });
  if (_.isNull(client)) {
    return respondNotFound('client of this invoice not found');
  }

  data = {
    ...data,
    template,
  };

  data = await exports.setSendTo(client, data);
  return respondSuccess({
    template: UnpaidTemplateService.renderWithInvoiceData(
      invoice_invoice,
      data,
    ),
  });
};

const parseJsonOrReturnError = (json) => {
  try {
    return JSON.parse(json);
  } catch (e) {
    return e;
  }
};

/**
 *
 * @param {string} phone
 * @returns
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return false;
  const str = phone.replace(/^\D+/g, '');

  if (str.length === 11 && str.substring(0, 2) === '34') {
    return `+${str}`;
  }

  if (str.length === 9) {
    return `+34${str}`;
  }

  return false;
};

exports.getClientIdsWithBadPhone = async () => {
  const allNotifications = await UnpaidNotification.findAll({
    where: {
      send_method: 'sms',
    },
    attributes: ['to', 'client_id'],
  });

  const clientIds = new Set();
  for (const notif of allNotifications) {
    const { to, client_id } = notif;
    const parsedTo = parseJsonOrReturnError(to);
    if (parsedTo instanceof Error || !parsedTo?.number) {
      clientIds.add(client_id);
      continue;
    }

    const phone = formatPhoneNumber(parsedTo.number);
    if (phone === false) {
      clientIds.add(client_id);
    }
  }

  return Array.from(clientIds);
};
