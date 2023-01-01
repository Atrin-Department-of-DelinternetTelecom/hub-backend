'use strict';

const { GfClient, GfFeeGroup, GfContract, GfFee, UnpaidChangeFeeNotification } =
  require('@models').intranet;

const fs = require('fs');

const moment = require('moment');

const config = require('@config');
const templates = config.get('index.templates');

const path = require('path');

const {
  respondNotFound,
  respondBadRequest,
  respondCreated,
  isResponsePayload,
} = require('@utils/response');

const { getClientPhone } = require('./UnpaidInvoiceService');

const {
  getAllEntities,
  findAndUpdate,
  findAndGet,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const { buildNotifier, buildChangeFeeMessage } = require('./notifiers');
const _ = require('lodash');
const { modelToJson } = require('@utils/tools');
const { Op } = require('sequelize');

const {
  isNotifierDisabled,
  getFirstCandidateAndRest,
  getNotifierCandidate,
  parseNumberToValidFormat,
} = require('./UnpaidSendNotificationsService');

const {
  Unpaid004,
  Unpaid006,
  Unpaid007,
  Unpaid008,
  Unpaid009,
  Unpaid010,
  Unpaid016_ClientResponsed,
  Unpaid017_CanNotCreateNewNotification,
} = require('@utils/exceptions').ExceptionsCode;

const STATUSES = {
  CANCELED: 'canceled',
  PENDING: 'pending',
  SENT: 'sent',
  ERROR: 'error',
};

const SEND_METHODS = {
  SMS: 'sms',
  Telegram: 'telegram',
  Whatsapp: 'whatsapp',
  Email: 'email',
};

const handlebars = require('handlebars');
const chagneFeeTemplate = handlebars.compile(
  fs
    .readFileSync(path.join(templates, 'change-fee-template.handlebars'))
    .toString(),
);

// this orden is important.
// business people want whastapp as first opton, then telegram and as last option sms
const NOTIFIERS = ['whatsapp', 'telegram', 'sms'];

/**
 *
 * save notification of a client
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postChangeFeeNotifications = async function (body, response = false) {
  const { new_fee_group_id, old_fee_group_id, contract_id, to } = body;

  // check new_fee_group is valid
  const new_fee_group = await GfFeeGroup.findOne({
    where: {
      id: new_fee_group_id,
      status: 1,
      active: 1,
    },
    include: {
      model: GfFee,
      as: 'gf_fees',
    },
  });
  if (_.isNull(new_fee_group)) {
    return respondNotFound(`fee group with id ${new_fee_group_id} not found`);
  }
  if (new_fee_group.gf_fees.length === 0) {
    return respondBadRequest(
      `fee_group with id ${new_fee_group_id} not valid fee`,
    );
  }

  // check contract is valid
  const contract = await GfContract.findByPk(contract_id);
  if (_.isNull(contract)) {
    return respondNotFound(`fee group with id ${contract_id} not found`);
  }

  // check fee_group of contract is valid
  const old_fee_group = await GfFeeGroup.findOne({
    where: {
      id: contract.feeGroupId,
    },
    include: {
      model: GfFee,
      as: 'gf_fees',
    },
  });
  if (_.isNull(old_fee_group)) {
    return respondNotFound(`fee group with id ${old_fee_group_id} not found`);
  }
  if (old_fee_group.gf_fees.length === 0) {
    return respondBadRequest(
      `fee_group with id ${old_fee_group_id} not valid fee`,
    );
  }

  // check client of contract id valid
  const client = await GfClient.findByPk(contract.clientId);
  if (!client) {
    return respondNotFound(`fee group with id ${contract.clientId} not found`);
  }

  // generate message (work with handlebars)
  const message = generateChangeFeeMessage(
    client.name,
    old_fee_group,
    new_fee_group,
  );

  //set valid client number
  let valid_number = '';
  if (!to) {
    valid_number = await parseNumberToValidFormat(
      await getClientPhone(client.id),
    );
    if (body.to == '') {
      return respondBadRequest(`client don't have valid number.`);
    }
  } else {
    valid_number = await parseNumberToValidFormat(to);
  }

  const newChangeFeeNotification = await UnpaidChangeFeeNotification.create({
    to: valid_number,
    old_fee_group_id: old_fee_group.id,
    new_fee_group_id: new_fee_group.id,
    contract_id: contract.id,
    client_id: client.id,
    message,
    send_date: body.send_date,
    send_method: body.send_method,
    metadata: body.metadata,
    created_by_retry: body.created_by_retry ?? null,
    creator_id: body.creator_id ?? null,
  });

  if (response) {
    return respondCreated(newChangeFeeNotification);
  }
  return newChangeFeeNotification;
};

exports.sendChangeFeeNotificationId = async (
  change_fee_notification_id,
  single_notification = false,
) => {
  try {
    const change_fee_notification = await UnpaidChangeFeeNotification.findByPk(
      change_fee_notification_id,
      {
        include: {
          all: true,
        },
      },
    );
    if (!change_fee_notification) {
      return respondNotFound(
        `notification with id ${change_fee_notification_id} not found`,
      );
    }

    const change_fee_notification_json = change_fee_notification.get({
      plain: true,
    });

    const { send_status, created_by_retry, send_method, result, id } =
      change_fee_notification_json;

    if ([STATUSES.CANCELED, STATUSES.SENT].includes(send_status)) {
      throw Unpaid004(change_fee_notification.id, send_status);
    }

    // result (client response) should be pending, for sending notification
    if (result !== 'pending') {
      throw Unpaid016_ClientResponsed(result);
    }

    // check that is notifier disabled or no
    if (!(await isNotifierDisabled(send_method))) {
      const response = await buildAndSend(
        change_fee_notification_json,
        change_fee_notification,
        single_notification,
      );
      return response;
    } else {
      change_fee_notification.send_status = STATUSES.CANCELED;
      await change_fee_notification.save();
      if (!single_notification && !created_by_retry) {
        return await tryUntilSendOrWhereNoMoreOptions(
          change_fee_notification_json,
          null,
          change_fee_notification,
        );
      }
      throw Unpaid010(id, send_method);
    }
  } catch (error) {
    console.log(error);
  }
};

/**
 * @returns {Promise<Response>}
 **/
const buildAndSend = async (
  notification,
  notificaitonModel,
  single_notification = false,
) => {
  const { to, created_by_retry, contract_id, id, send_method } = notification;

  // check that we don't have any problem with send_method
  if (!send_method || !_.includes(NOTIFIERS, send_method)) {
    throw Unpaid007(id, send_method);
  }

  let clientNumber = to;
  if (to == '' || _.isUndefined(to) || _.isNull(to)) {
    // try to get number from client
    clientNumber = to;
    if (
      clientNumber == '' ||
      _.isUndefined(clientNumber) ||
      _.isNull(clientNumber)
    ) {
      notificaitonModel.send_status = STATUSES.CANCELED;
      await notificaitonModel.save();
      throw Unpaid008(id, send_method);
    }
  }
  notification.contactPhone = clientNumber;
  const notifierInstance = buildNotifier(send_method);

  const message = buildChangeFeeMessage(notification);

  await notifierInstance.send(message);
  if (notifierInstance.wasMessageSent()) {
    notificaitonModel.send_status = STATUSES.SENT;
    await notificaitonModel.save();

    //we need this?? (add this to task??)
    // await handleNotificationHistory(notification, clientNumber);

    return {
      time: new Date(),
      clientNumber,
      contractId: contract_id,
      notificationId: id,
      sentMessage: message.getMessage(),
    };
  } else {
    notificaitonModel.send_status = STATUSES.ERROR;
    await notificaitonModel.save();
    if (!single_notification && !created_by_retry) {
      return tryUntilSendOrWhereNoMoreOptions(
        notification,
        null,
        notificaitonModel,
      );
    }
    throw Unpaid009(id, send_method);
  }
};

const tryUntilSendOrWhereNoMoreOptions = async function (
  notification,
  candidateOptions = null,
  notificaitonModel = null,
) {
  const { id, send_method } = notification;

  const candidates = getNotifierCandidate(send_method, candidateOptions);
  if (!candidates.length) {
    notificaitonModel.send_status = STATUSES.ERROR;
    await notificaitonModel.save();
    throw Unpaid006(id);
  }

  const { first, rest } = getFirstCandidateAndRest(candidates);

  notification = {
    ...notification,
    send_method: first,
    previous_send_method: send_method,
    original_notification_id: notification.id,
  };

  if (!(await isNotifierDisabled(notification.send_method))) {
    notification = await prepareAnotherTypeOfNotification(notification);
    const newNotificationModel = await UnpaidChangeFeeNotification.findByPk(
      notification.id,
    );
    const response = await buildAndSend(notification, newNotificationModel);
    return response;
  }
  return tryUntilSendOrWhereNoMoreOptions(
    notification,
    rest,
    notificaitonModel,
  );
};

const prepareAnotherTypeOfNotification = async (notification) => {
  const { send_method, previous_send_method } = notification;
  notification.created_by_retry = true;
  switch (send_method) {
    case SEND_METHODS.SMS: {
      const createdNewNotification = await exports.postChangeFeeNotifications(
        notification,
      );
      if (isResponsePayload(createdNewNotification)) {
        throw Unpaid017_CanNotCreateNewNotification();
      }
      return {
        ...notification,
        ...modelToJson(createdNewNotification),
        previous_send_method,
      };
    }

    case SEND_METHODS.Whatsapp: {
      const createdNewWhatsappNotification =
        await exports.postChangeFeeNotifications(notification);
      if (isResponsePayload(createdNewWhatsappNotification)) {
        throw Unpaid017_CanNotCreateNewNotification();
      }

      return {
        ...notification,
        ...modelToJson(createdNewWhatsappNotification),
        previous_send_method,
      };
    }

    case SEND_METHODS.Telegram: {
      const createdNewTelegramNotification =
        await exports.postChangeFeeNotifications(notification);
      if (isResponsePayload(createdNewTelegramNotification)) {
        throw Unpaid017_CanNotCreateNewNotification();
      }
      return {
        ...notification,
        ...modelToJson(createdNewTelegramNotification),
        previous_send_method,
      };
    }

    default:
      return notification;
  }
};

const generateChangeFeeMessage = (
  client_name,
  old_gf_fee_group,
  new_gf_fee_group,
) => {
  const old_fee_price = parseFloat(
    old_gf_fee_group.gf_fees[old_gf_fee_group.gf_fees.length - 1].baseQuote,
  ).toFixed(2);
  const new_fee_price = parseFloat(
    new_gf_fee_group.gf_fees[new_gf_fee_group.gf_fees.length - 1].baseQuote,
  ).toFixed(2);

  return chagneFeeTemplate({
    client_name,
    old_fee_alias: old_gf_fee_group.name,
    new_fee_alias: new_gf_fee_group.name,
    old_fee_price,
    new_fee_price,
  });
};
