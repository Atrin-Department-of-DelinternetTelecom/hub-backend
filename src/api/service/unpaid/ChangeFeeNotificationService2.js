'use strict';

const _ = require('lodash');

const { respondNotFound, respondBadRequest } = require('@utils/response');

const handlebars = require('handlebars');

const { GfClient, GfFeeGroup, GfFee, UnpaidChangeFeeNotification } =
  require('@models').intranet;

const { getClientPhone } = require('./UnpaidInvoiceService');
const ChangeFeeNotificationService = require('./ChangeFeeNotificationService');

const CrmTaskHelperService = require('../intranet/CrmTaskHelperService');

exports.send = async function ({
  contractId,
  oldFeeGroupId,
  newFeeGroupId,
  clientId,
  userId,
  systemUserId,
  template,
}) {
  const client = await GfClient.findByPk(clientId);
  if (!client) {
    return respondNotFound(`fee group with id ${clientId} not found`);
  }

  const newFeeGroup = await GfFeeGroup.findOne({
    where: {
      id: newFeeGroupId,
      status: 1,
      active: 1,
    },
    include: {
      model: GfFee,
      as: 'gf_fees',
    },
  });

  const oldFeeGroup = await GfFeeGroup.findOne({
    where: {
      id: oldFeeGroupId,
    },
    include: {
      model: GfFee,
      as: 'gf_fees',
    },
  });

  if (_.isNull(newFeeGroup)) {
    return respondNotFound(`fee group with id ${newFeeGroup} not found`);
  }
  if (newFeeGroup.gf_fees.length === 0) {
    return respondBadRequest(`fee_group with id ${newFeeGroup} not valid fee`);
  }

  const message = generateChangeFeeMessage(
    template,
    client.name,
    oldFeeGroup,
    newFeeGroup,
  );

  const to = formatPhoneNumber(await getClientPhone(client.id));
  if (!to) return false;

  const newChangeFeeNotification = await UnpaidChangeFeeNotification.create({
    to,
    old_fee_group_id: oldFeeGroupId,
    new_fee_group_id: newFeeGroupId,
    contract_id: contractId,
    client_id: client.id,
    message,
    send_date: new Date(),
    send_method: 'sms',
    created_by_retry: null,
    creator_id: systemUserId,
  });

  await ChangeFeeNotificationService.sendChangeFeeNotificationId(
    newChangeFeeNotification.id,
    true,
  );

  await CrmTaskHelperService.createFullEvent(
    'send_change_fee_notification',
    contractId,
    {
      subject: 'send change fee notification',
      text: 'sent notification for change fee of this contract',
    },
    null,
    null,
    userId,
  );

  return {
    success: true,
    changeFeedNotificationId: newChangeFeeNotification.id,
  };
};

const generateChangeFeeMessage = (
  template,
  clientName,
  oldGfFeeGroup,
  newGfFeeGroup,
) => {
  const oldFeePrice = parseFloat(
    oldGfFeeGroup.gf_fees[oldGfFeeGroup.gf_fees.length - 1].baseQuote,
  ).toFixed(2);
  const newFeePrice = parseFloat(
    newGfFeeGroup.gf_fees[newGfFeeGroup.gf_fees.length - 1].baseQuote,
  ).toFixed(2);

  const compiledTemplate = handlebars.compile(template);

  return compiledTemplate({
    clientName,
    oldFeeAlias: oldGfFeeGroup.name,
    newFeeAlias: newGfFeeGroup.name,
    oldFeePrice,
    newFeePrice,
  });
};

/**
 *
 * @param {string} phone
 * @returns
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return false;
  const str = phone.replace(/^\D+/g, '');

  if (str.length !== 9 && str.length !== 11) {
    return false;
  }

  if (str.length === 11 && str.substring(0, 2) === '34') {
    return `+${str}`;
  }

  if (str.length === 9) {
    return `+34${str}`;
  }
};
