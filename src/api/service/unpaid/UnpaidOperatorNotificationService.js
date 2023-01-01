'use strict';

const {
  intranet: { GfClient, UnpaidOperatorNotification },
} = require('@models');

const {
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const {
  getAllEntities,
  findAndUpdate,
  findAndGet,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const _ = require('lodash');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const config = require('@config');

/**
 *
 * delete a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteUnpaidOperatorNotificationsId = async function (id) {
  return findAndDeleteIntranet(id, UnpaidOperatorNotification);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getUnpaidOperatorNotifications = async function (query) {
  return getAllEntities(query, UnpaidOperatorNotification, undefined, [
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
exports.getUnpaidOperatorNotificationsId = async function (id) {
  return findAndGet(id, UnpaidOperatorNotification);
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUnpaidOperatorNotifications = async function (body) {
  return respondCreated(await UnpaidOperatorNotification.create(body));
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
exports.putUnpaidOperatorNotificationsId = async function (id, body) {
  return findAndUpdate(id, body, UnpaidOperatorNotification);
};

exports.addInvoiceIssue = async function (
  invoice_id,
  invoice_code,
  client_id,
  issue_type = config.InvoiceIssueType.NOTIFICATION,
  model_id = 0,
  message,
  user,
) {
  const operator_notification = await UnpaidOperatorNotification.findOne({
    where: { invoice_id },
  });

  if (!operator_notification) {
    const creator_type = user ? 'User' : 'System';
    const metaContainer = {};
    const uuid = uuidv4();
    metaContainer[uuid] = {
      id: uuid, //random string
      model_type: issue_type,
      model_id,
      message,
      seen: false,
      seen_by: null,
      seen_at: null,
      created_by: user?.id ?? 0,
      created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
    };
    const metadata = JSON.stringify(metaContainer);

    return await UnpaidOperatorNotification.create({
      invoice_id,
      invoice_code,
      client_id: client_id ?? 0,
      creator_type,
      user_id: user?.id ?? 0,
      metadata,
    });
  } else {
    const metaContainer = JSON.parse(operator_notification.metadata);
    if (!hasMetaContainerThisIssue(metaContainer, message)) {
      const uuid = uuidv4();
      metaContainer[uuid] = {
        id: uuid, //random string
        model_type: issue_type,
        model_id,
        message,
        seen: false,
        seen_by: null,
        seen_at: null,
        created_by: user?.id ?? 0,
        created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
      };
      operator_notification.metadata = JSON.stringify(metaContainer);
      return await operator_notification.save();
    }
    return operator_notification;
  }
};

const hasMetaContainerThisIssue = (meta, newIssueType) => {
  let result = false;
  for (const issue of Object.values(meta)) {
    if (issue.message === newIssueType) {
      result = true;
    }
  }
  return result;
};

exports.setIssueAsSeen = async (invoice_id, issue_id, user = null) => {
  const operator_notification = await UnpaidOperatorNotification.findOne({
    where: {
      invoice_id,
    },
  });

  if (!operator_notification) {
    return respondNotFound(
      `operator notification with invoice_id ${invoice_id} not found`,
    );
  }

  const metadata = JSON.parse(operator_notification.metadata);

  if (!metadata[issue_id]) {
    return respondNotFound(`issue with id ${issue_id} not found`);
  }

  metadata[issue_id].seen = true;
  metadata[issue_id].seen_by = user;
  metadata[issue_id].seen_at = moment().format('YYYY-MM-DD HH:mm:ss');

  operator_notification.metadata = JSON.stringify(metadata);
  await operator_notification.save();
  return respondSuccess(operator_notification);
};
