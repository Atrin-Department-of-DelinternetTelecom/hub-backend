'use strict';

const moment = require('moment');

const { buildNotifier, buildMessage } = require('./notifiers');

const { Op } = require('sequelize');

const {
  intranet: { GfClient, UnpaidInvoice, UnpaidNotification },
} = require('@models');

const { addInvoiceIssue } = require('./UnpaidOperatorNotificationService');

const CrmTaskHelperService = require('../intranet/CrmTaskHelperService');

const { getDisabledNotifiers } = require('./UnpaidSettingService');

const {
  putUnpaidNotificationsId,
  cloneNotification,
} = require('./UnpaidNotificationService');

const { isResponsePayload } = require('@utils/response');

const { findAndGet } = require('@utils/request-handler');

const {
  Unpaid002,
  Unpaid003,
  Unpaid004,
  Unpaid006,
  Unpaid007,
  Unpaid008,
  Unpaid009,
  Unpaid010,
  Unpaid011,
  Unpaid019_UnpaidInvoiceHasPaid,
} = require('@utils/exceptions').ExceptionsCode;

const { getClientPhone } = require('./UnpaidInvoiceService');

const _ = require('lodash');

const { modelToJson } = require('@utils/tools');

const STATUSES = {
  PAID: 'paid',
  CUTTED: 'cutted',
  CANCELED: 'canceled',
  SENT: 'sent',
  ERROR: 'error',
};

const SEND_METHODS = {
  SMS: 'sms',
  Telegram: 'telegram',
  Whatsapp: 'whatsapp',
  Email: 'email',
};

const FALLBACK_STATUS = [STATUSES.PAID, STATUSES.CUTTED, STATUSES.CANCELED];

const { ensureInvoiceFallbackSmsCounter } = require('./UnpaidSettingService');
const { default: to } = require('await-to-js');
const NOTIFIERS = ['whatsapp', 'telegram', 'sms', 'email'];

/**
 * Return a given size of records base on time and notificaiton status.
 * @param {number} mount - if unit is hour this value should be a valid amount
 * @param {string} unit - any moment unit, check moment docs
 * @param {number} maxSize - limit of returned records
 * @param {'pending'|'sent'|'canceled'|'error'} status - status of the notifications;
 * @returns {Promise<Array<Model>>}
 */
exports.getLastNotificationByGivenTime = async function (
  mount = 14,
  unit = 'day',
  maxSize = 30,
  status = 'pending',
) {
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  const start = moment().subtract(mount, unit).format('YYYY-MM-DD HH:mm:ss');
  const foundedNotifications = await UnpaidNotification.findAll({
    where: {
      send_status: status,
      send_date: {
        [Op.between]: [start, now],
      },
    },
    limit: maxSize,
    attributes: ['id'],
  });
  return foundedNotifications;
};
/**
 *
 *
 * To send message to a client we must validate some
 * contrains before send a message:
 *
 * - We need a notification in the system, with an status
 *   peding or error.
 *
 * - The invoice of that notification have not to be one of:
 *   "paid", "cutted" or "canceled".
 *
 * - We need a valid notifier, this means that
 *   the send_method value into the notification
 *   must be equal to some of the available notifiers.
 *
 * - A notifier is valid if: 1. Exists, 2. if is no in the list of
 *   bocked one.
 *
 * - The client we want to notify must have a valid phone number.
 *
 * Implement an algorithm that try any intents to send a notifications
 * as avalaible notifiers. That means that if we have 5 notifiers, and
 * 5 types of notifications, we will retry if send notification fail,
 * one a another until to use all notifiers candidates up.
 *
 * Considerations: we can end the process without sending any notification.
 * - Each Invoice has a limit to send sms notifications, this is called
 *  as sms fallback.
 * So we need to check that in cause we try to send a sms as and selected option.
 *
 * *** THIS FUNCTION MUST BE WRAPPED IN TRY CATCH ****
 */
exports.sendNotification = async function (id, single_notification = false) {
  const notification = await findAndGet(
    id,
    UnpaidNotification,
    false,
    true,
    true,
  );
  if (isResponsePayload(notification)) return notification;

  const { send_status, created_by_retry, invoice_id, client_id, send_method } =
    notification;

  const isPaid = await UnpaidInvoice.findOne({
    where: { id: invoice_id, invoice_status: 'paid' },
  });
  if (isPaid) {
    await putUnpaidNotificationsId(id, {
      ...notification,
      send_status: STATUSES.CANCELED,
    });

    addInvoiceIssue(
      invoice_id,
      isPaid.invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid019_UnpaidInvoiceHasPaid(id).message,
    );
    throw Unpaid019_UnpaidInvoiceHasPaid(isPaid.id);
  }

  if ([STATUSES.CANCELED, STATUSES.SENT].includes(send_status)) {
    throw Unpaid004(notification.id, send_status);
  }

  const notificationWithAuthor = {
    ...notification,
  };
  const unpaidInvoice = await exports.ensureInvoiceStatus(
    notificationWithAuthor,
  );

  const full_notification = {
    ...notification,
    unpaidInvoice,
  }; //<- let's save to avoid one query more. we'll need it.

  const isDisabled = await exports.isNotifierDisabled(send_method);
  if (!isDisabled) {
    const [error, result] = await to(
      exports.buildAndSend(full_notification, single_notification),
    );

    if (error)
      return tryUntilSendOrWhereNoMoreOptions(
        full_notification,
        NOTIFIERS.filter((notifier) => notifier !== send_method),
      );
    return result;
  } else {
    const { id: failedNotificationId } = notification;
    await putUnpaidNotificationsId(failedNotificationId, {
      ...notification,
      send_status: STATUSES.ERROR,
    });

    // here we will try other, so before take other update previous
    if (!single_notification && !created_by_retry) {
      return tryUntilSendOrWhereNoMoreOptions(full_notification);
    }
    addInvoiceIssue(
      invoice_id,
      notification.UnpaidInvoice.invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid010(id, send_method).message,
    );
    throw Unpaid010(id, send_method);
  }
};

/**
 * Find and check the status of an unpaidInvoice.
 * If was found return it.
 *
 * @param {any} notification
 * @returns {Promise<any>} - UnpaidInvoice
 * @throws {Error} - If no unpaidInvoice and if invoice status is one of "paid", "cutted", "canceled"
 */
exports.ensureInvoiceStatus = async function (notification) {
  const { id, invoice_id } = notification;

  const unpaidInvoice = await findAndGet(
    invoice_id,
    UnpaidInvoice,
    {
      model: GfClient,
      as: 'client',
    },
    true,
    true,
  );
  if (isResponsePayload(unpaidInvoice)) {
    await putUnpaidNotificationsId(id, {
      send_status: STATUSES.CANCELED,
    });
    //throw new Unpaid005(id);
    return unpaidInvoice;
  }

  const { invoice_status, invoice_code, client_id } = unpaidInvoice;

  if (FALLBACK_STATUS.includes(invoice_status)) {
    await addInvoiceIssue(
      invoice_id,
      invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid003(invoice_id).message,
    );
    await putUnpaidNotificationsId(id, {
      send_status: STATUSES.CANCELED,
    });
    throw Unpaid003(invoice_id);
  }

  return unpaidInvoice;
};

/**
 * Check if given notifier is in the list of
 * disabled notifiers setted up by operators.
 *
 * If is provide a list of disabled notifiers, function
 * will use it to compare, if not will use a service
 * function to get a list of disabled notifiers to
 * compare.
 *
 * @param {String} needed - comparing value.
 * @param {Array<String>} disabledNotifiers - use it to compare
 * @returns {Promise<Boolean>}
 */
exports.isNotifierDisabled = async function (
  needed,
  disabledNotifiers = undefined,
) {
  if (!disabledNotifiers) {
    disabledNotifiers = await getDisabledNotifiers();
  }
  return disabledNotifiers.includes(needed);
};

/**
 * Search for possible notifiers candidates. Only for search.
 * If second params is provided, function will take it to compare,
 * otherwise will query db.
 *
 * @param {string} except - Any Notifier name we want to exclude from the search
 * @param {string[] | null} sendersOptions - list notifiers to avaluate.
 * @returns {string[]} - all next or current possible canditates to send a notification
 */
exports.getNotifierCandidate = function (except, sendersOptions = null) {
  if (!sendersOptions) sendersOptions = NOTIFIERS;

  const possibleCandidates = [];

  // we find all posible senders except current
  for (const option of sendersOptions) {
    if (option !== except) possibleCandidates.push(option);
  }

  return possibleCandidates;
};

/**
 * Helper function to get first from a given array and others.
 * @param {string[]} possibleCandidates
 */
exports.getFirstCandidateAndRest = function (possibleCandidates = []) {
  if (!possibleCandidates || !possibleCandidates.length) {
    return {
      success: false,
      first: '',
      rest: [],
    };
  }
  const first = possibleCandidates[0];
  const rest = possibleCandidates.slice(1);
  return {
    success: true,
    first,
    rest,
  };
};

/**
 * Recursive Function that test until send a notification or until
 * there is no more options.
 *
 * @param {any} notification
 * @returns {Promise<Response|Error>}
 * @throws {Error}
 */
const tryUntilSendOrWhereNoMoreOptions = async function (
  notification,
  candidateOptions = null,
) {
  const { id, send_method, invoice_id, client_id } = notification;
  const candidates = exports.getNotifierCandidate(
    send_method,
    candidateOptions,
  );
  const disabledCandidated = await getDisabledNotifiers(); // for debug only
  const candidatesNotDisabled = _.difference(candidates, disabledCandidated);
  if (!candidatesNotDisabled.length) {
    await putUnpaidNotificationsId(id, {
      send_status: STATUSES.ERROR, // TODO check this
    });

    addInvoiceIssue(
      invoice_id,
      notification.unpaidInvoice.invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid006(id).message,
    );
    throw Unpaid006(id);
  }

  // [sms, telegram, ...]
  const { first, rest } = exports.getFirstCandidateAndRest(
    candidatesNotDisabled,
  );
  notification = {
    ...notification,
    send_method: first,
    previous_send_method: send_method,
    original_notification_id: notification.id,
  }; // <- updating its property

  const isDisabled = await exports.isNotifierDisabled(notification.send_method);

  if (!isDisabled) {
    // <- [BaseCase] : No disable and good to try
    notification = await prepareAnotherTypeOfNotification(notification);
    const response = await exports.buildAndSend(notification);
    return response;
  }

  return tryUntilSendOrWhereNoMoreOptions(notification, rest);
};

exports.parseNumberToValidFormat = async (
  number = '',
  invoice_info,
  notification_id,
) => {
  if (number) {
    const str = number.replace(/^\D+/g, '');

    if (str.length !== 9 && str.length !== 11) {
      await putUnpaidNotificationsId(notification_id, {
        send_status: STATUSES.ERROR,
      });

      await addInvoiceIssue(
        invoice_info.id,
        invoice_info.invoice_code,
        invoice_info.client_id,
        'Notification',
        notification_id,
        Unpaid011(number).message,
      );
      throw Unpaid011(number);
    }

    if (str.length === 11 && str.substring(0, 2) === '34') {
      return `+${str}`;
    }

    if (str.length === 9) {
      return `+34${str}`;
    }
  }
  await putUnpaidNotificationsId(notification_id, {
    send_status: STATUSES.ERROR,
  });

  await addInvoiceIssue(
    invoice_info.id,
    invoice_info.invoice_code,
    invoice_info.client_id,
    'Notification',
    notification_id,
    Unpaid011(number).message,
  );

  throw Unpaid011(number);
};

async function getClientNumber(to, client_id) {
  try {
    const parsedTo = JSON.parse(to);
    return parsedTo.number;
  } catch (error) {
    return getClientPhone(client_id);
  }
}

exports.buildAndSend = async function (
  notification,
  single_notification = false,
) {
  const {
    invoice_id,
    client_id,
    to,
    created_by_retry,
    id,
    send_method,
    unpaidInvoice,
  } = notification;

  if (!NOTIFIERS.includes(send_method)) {
    await addInvoiceIssue(
      invoice_id,
      unpaidInvoice.invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid007(id, send_method).message,
    );
    throw Unpaid007(id, send_method); //addInvoiceIssue  ok
  }

  if (send_method == SEND_METHODS.SMS) {
    const clientNumber = await getClientNumber(to, client_id);
    if (!clientNumber) {
      await putUnpaidNotificationsId(id, {
        send_status: STATUSES.CANCELED,
      });
      await addInvoiceIssue(
        invoice_id,
        unpaidInvoice.invoice_code,
        client_id,
        'Notification',
        id,
        Unpaid008(id, send_method).message,
      );
      throw Unpaid008(id, send_method);
    }

    const isSmsFallbackOK = await ensureInvoiceFallbackSmsCounter(
      notification.unpaidInvoice,
    );
    if (!isSmsFallbackOK) {
      await putUnpaidNotificationsId(id, {
        send_status: STATUSES.CANCELED,
      });
      addInvoiceIssue(
        invoice_id,
        unpaidInvoice.invoice_code,
        client_id,
        'Notification',
        id,
        Unpaid002(invoice_id).message,
      );
      return {
        time: new Date(),
        clientNumber: null,
        sentMessage: null,
        invoiceId: unpaidInvoice.id,
        notificationId: id,
      };
    }

    notification.contactPhone = await exports.parseNumberToValidFormat(
      clientNumber,
      notification.unpaidInvoice,
      id,
    );
  }

  // here we will create an sms,telegram notifier to make request (using axios)
  const notifierInstance = buildNotifier(send_method);

  // prepare notification for sending throught notifiers
  const message = buildMessage(notification);

  // send method should catch and set isSent = false
  await notifierInstance.send(message);
  if (notifierInstance.wasMessageSent()) {
    // if sms increment fallback_sms_counter
    if (send_method === SEND_METHODS.SMS) {
      const { fallback_sms_counter } = unpaidInvoice;
      unpaidInvoice.fallback_sms_counter = fallback_sms_counter + 1;
      const unpaidInvoiceModel = await UnpaidInvoice.findByPk(unpaidInvoice.id);
      unpaidInvoiceModel.fallback_sms_counter =
        unpaidInvoice.fallback_sms_counter;
      await unpaidInvoiceModel.save();
      // saving MessageHistory in other system.
      await handleNotificationHistory(notification, notification.contactPhone);
    }

    await UnpaidNotification.update(
      {
        send_status: STATUSES.SENT,
        provider_message_id: notifierInstance.provider_message_id ?? null,
        send_method,
      },
      {
        where: {
          id,
        },
      },
    );

    return {
      time: new Date(),
      clientNumber: notification.contactPhone,
      sentMessage: message.getMessage(),
      invoiceId: unpaidInvoice.id,
      notificationId: notification.id,
    };
  } else {
    await putUnpaidNotificationsId(id, {
      send_status: STATUSES.ERROR,
    });

    if (!created_by_retry && !single_notification) {
      return tryUntilSendOrWhereNoMoreOptions(notification);
    }

    await addInvoiceIssue(
      invoice_id,
      unpaidInvoice.invoice_code,
      client_id,
      'Notification',
      id,
      Unpaid009(notification.id, send_method).message,
    );
    throw Unpaid009(notification.id, send_method);
  }
};

const handleNotificationHistory = async function (notification, clientNumber) {
  const { unpaidInvoice, send_method } = notification;

  const { id } = unpaidInvoice;

  const additionalData = {
    phone: clientNumber,
    sendDate: new Date(),
    via: send_method,
  };

  /** @type {'sms' | 'unpaid'} */
  let historyType = 'sms';

  // For avoid duplication in NotificationHistory make sure there is an open invoice event
  // in case no we need to create otherwise just merge.
  if (unpaidInvoice.event_id == 0) {
    // <- creating

    historyType = 'unpaid';

    //add new events to old intranet
    const eventId = await CrmTaskHelperService.saveUnpaidTaskForNotify(
      unpaidInvoice,
      historyType,
      null,
      additionalData,
    );

    //update unpaid invoice with event id
    //to track it in future
    unpaidInvoice.event_id = eventId;
    await UnpaidInvoice.update(
      {
        eventId,
      },
      {
        where: {
          id,
        },
      },
    );
  }

  await CrmTaskHelperService.saveUnpaidTaskForNotify(
    unpaidInvoice,
    'unpaid',
    null,
    additionalData,
  );
};

/**
 * If a notificaiton was setted for being sending by sms
 * but was not possible to use smsNotifier, we need to build
 * a different notification. As the template should be diff.
 * E,g: for sms template has a different len that others.
 *
 * Orders:
 *
 */
const prepareAnotherTypeOfNotification = async (notification) => {
  const {
    send_method,
    previous_send_method,
    invoice_id,
    client_id,
    unpaidInvoice,
    id,
  } = notification;

  switch (send_method) {
    case SEND_METHODS.SMS: {
      const isSmsFallbackOK = await ensureInvoiceFallbackSmsCounter(
        unpaidInvoice,
      );
      if (!isSmsFallbackOK) {
        await putUnpaidNotificationsId(notification.id, {
          send_status: STATUSES.ERROR,
        });
        await addInvoiceIssue(
          invoice_id,
          unpaidInvoice.invoice_code,
          client_id,
          'Notification',
          id,
          Unpaid002(invoice_id).message,
        );
        throw Unpaid002(invoice_id);
      }
      notification.created_by_retry = true;
      const newNotification = modelToJson(
        await cloneNotification(notification, SEND_METHODS.SMS),
      );
      // If fallback is ok we can send sms as option.s
      // we dont end here, because we're only building the new sms cloneNotificationAsSms

      return {
        ...notification,
        ...newNotification, // override previous props, template must important here
        // original_notification_id: notification.original_notification_id,
        previous_send_method,
      };
    }

    case SEND_METHODS.Whatsapp: {
      notification.created_by_retry = true;
      const whatsappNoti = modelToJson(
        await cloneNotification(notification, SEND_METHODS.Whatsapp),
      );

      return {
        ...notification,
        ...whatsappNoti, // override previous props, template must important here
        // original_notification_id: notification.original_notification_id,
        previous_send_method,
      };
    }

    case SEND_METHODS.Telegram: {
      notification.created_by_retry = true;
      const telegramNoti = modelToJson(
        await cloneNotification(notification, SEND_METHODS.Telegram),
      );

      return {
        ...notification,
        ...telegramNoti, // override previous props, template must important here
        // original_notification_id: notification.original_notification_id,
        previous_send_method,
      };
    }
    case SEND_METHODS.Email: {
      return {
        ...notification,
        created_by_retry: true,
        previous_send_method,
      };
    }
    default:
      return notification;
  }
};
