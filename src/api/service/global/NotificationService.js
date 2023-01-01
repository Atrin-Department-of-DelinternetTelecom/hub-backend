'use strict';

const { Notification, User } = require('@models').system;

const { GlobalNotificationsHistory } = require('@models').moozaic;

const { CrTask } = require('@models').intranet;

const intranetNotificationServie = require('../intranet/NotificationService');

const moment = require('moment');

const _ = require('lodash');

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const { respondBadRequest, respondSuccess } = require('@utils/response');
const { Op } = require('sequelize');

/**
 *
 * delete a notification record by id
 *
 * id String
 * returns Object
 **/
exports.deleteNotificationsId = async function (id) {
  return await findAndDelete(id, Notification);
};

/**
 * Your GET endpoint
 * get all notification(information) record
 *
 * returns Object
 **/
exports.getNotifications = async function (query) {
  return await getAllEntities(query, Notification);
};

/**
 * Your GET endpoint
 * get single notification record by id
 *
 * id String
 * returns Object
 **/
exports.getNotificationsId = async function (id) {
  return await findAndGet(id, Notification);
};

/**
 *
 * add a notification record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postNotifications = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, Notification);
};

/**
 *
 * update a notification record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected notification (optional)
 * returns Object
 **/
exports.putNotificationsId = async function (id, body) {
  return await findAndUpdate(id, body, Notification);
};

/**
 *
 * get notifications of user by user_id
 *
 * owner_id
 *
 * returns all
 **/
exports.getNotificationsUserId = async function (query, owner_id) {
  if ((await User.findByPk(owner_id)) === null) {
    return respondBadRequest('user not found');
  }
  return await getAllEntities(query, Notification, { owner_id });
};

exports.getMyNotifications = async (query, login_user_id) => {
  return await getAllEntities(query, Notification, {
    owner_id: login_user_id,
    read: 0,
    metadata: {
      [Op.notLike]: 'intranet_notification_id', //not intranet notification
    },
  });
};

/**
 * set as read for notifications
 * @param {Array} notification_ids id of notifications for set as read
 * @param {boolean} seen_all true if all notifications are seen
 * @param {number} login_user_id id of user who is login (system user)
 * @returns {Promise<{object}>} response of update notificationss
 */
exports.postSetAsReadNotifications = async (
  notification_ids,
  notification_refrence = 'system',
  seen_all = false,
  login_user_id,
  intranet_user_id,
) => {
  if (notification_refrence === 'system') {
    let notificationQuery = {};
    if (seen_all) notificationQuery = { owner_id: login_user_id };
    else notificationQuery = { id: notification_ids };

    await Notification.update({ read: 1 }, { where: notificationQuery });

    //update intranet notification (if global notification related to intranet notification)
    const intranetNotifications = [];
    (
      await Notification.findAll({
        where: notificationQuery,
      })
    ).forEach((notification) => {
      const intranet_notification_id = _.get(
        notification,
        'metadata.intranet_notification_id',
        0,
      );
      if (intranet_notification_id)
        intranetNotifications.push(intranet_notification_id);
    });
    intranetNotificationServie.setRead(
      intranetNotifications,
      false,
      false,
      intranet_user_id,
    );
  } else {
    await intranetNotificationServie.setRead(
      seen_all ? -1 : notification_ids,
      false,
      false,
      intranet_user_id,
    );
  }

  return respondSuccess(`seen`);
};

exports.getMyIntranetNotification = async (query, intranet_user_id) => {
  return await getAllEntities(query, GlobalNotificationsHistory, {
    userId: intranet_user_id,
    cardRead: 0,
  });
};

exports.countMyUnreadIntranetNotification = async (intranet_user_id) => {
  const unreadNotification = await GlobalNotificationsHistory.count({
    where: { userId: intranet_user_id, cardRead: 0 },
  });
  return respondSuccess({ intranet_unread_notification: unreadNotification });
};
