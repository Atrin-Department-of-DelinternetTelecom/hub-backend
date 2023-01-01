'use strict';

const {
  intranet: { CrChat, CrChatRead },
  moozaic: { MoozaicUser },
  system: { User },
} = require('@models');

const { getAllEntities } = require('@utils/request-handler');

const { respondSuccess, respondBadRequest } = require('@utils/response');

const { Op } = require('sequelize');

const _ = require('lodash');

const { sendMessage } = require('./MessageService');
const { intranet } = require('@lib/knex');
const { pluck } = require('@api/utils/collections');

/**
 * Your GET endpoint
 * get all messages record
 *
 * returns Object
 **/
exports.getIntranetMessages = async function (query) {
  return getAllEntities(query, CrChat, undefined, [
    { model: User, as: 'system_user' },
    { model: MoozaicUser, as: 'from_user' },
  ]);
};

/**
 * Your GET endpoint
 * send new message
 *
 * returns Object
 **/
exports.postIntranetMessages = async function (body, login_user_id) {
  const { messageId } = await sendMessage(
    body.text,
    body.filter,
    body.fromUserId,
    login_user_id,
  );

  return respondSuccess(
    await CrChat.findByPk(messageId, {
      include: { model: MoozaicUser, as: 'from_user' },
    }),
  );
};

/**
 * count unread messages that related to user ids with some condition (filter)
 * @param {Array} userIds id of users to count unread messages
 * @param {object} filter filter messages (where)
 * @returns {number} count unread messages related to user ids
 */
exports.getUnreadCount = async (userIds, filter) => {
  const unreadCount = await getUnreadCount(userIds, filter);
  return respondSuccess({
    unreadCount,
  });
};

/**
 * get read status based on tasks
 * @param {number} userId get read status for which user
 * @param {string} stringifiedFilterArray id of tasks to get
 *
 * @returns {Promise<{[index:string]:number}>}
 */
exports.getUnreadsForUser = async (userId, stringifiedFilterArray) => {
  try {
    const countUnread = await getUnreadCount([userId], {
      filter: JSON.parse(stringifiedFilterArray),
    });

    return respondSuccess(countUnread);
  } catch (error) {
    return respondBadRequest(`invalid task ids`);
  }
};

const getUnreadCount = async (userIds, { filter }) => {
  const users = Array.isArray(userIds) ? userIds.flat() : [userIds];
  const tasks = Array.isArray(filter) ? filter.flat() : [filter];

  const counts = await intranet('global_messages as c')
    .select('c.filter') // group by filter column
    .count('c.id as unreadCount')
    .leftJoin('global_messages_read as r', function () {
      this.on('r.messageId', 'c.id').andOnIn('r.userId', users);
    })
    .whereIn('c.filter', tasks)
    .whereNotIn('c.fromUserId', users)
    .where(function () {
      this.whereIn('c.toUserId', users).orWhereNull('c.toUserId');
    })
    .andWhere(function () {
      this.whereNull('r.messageId').orWhereNotIn('r.userId', users);
    })
    .groupBy('c.filter');

  const collection = pluck(counts, 'unreadCount', 'filter');
  // ensure
  tasks.forEach((taskId) => {
    collection[taskId] = collection[taskId] ?? 0;
  });

  return collection;
};

/**
 * get some last unread messages of a user(user that loged in) and set as read
 * @param {number} loginUserId message related to this user (user that loged in)
 * @param {object} filter filter messages
 * @param {number} limit number of last messages to set as read
 */
exports.setAsRead = async (loginUserId, filter, limit = 10) => {
  const unreadMessages = await CrChat.findAll({
    where: {
      toUserId: {
        [Op.or]: {
          [Op.eq]: loginUserId,
          [Op.eq]: null,
        },
      },

      fromUserId: {
        [Op.ne]: loginUserId,
      },
      ...filter,
    },
    include: {
      model: CrChatRead,
      as: 'read_info',
      required: false,
      where: {
        userId: {
          [Op.ne]: loginUserId,
          messageId: null,
        },
      },
    },
    limit,
    order: [['creationDate', 'desc']],
    raw: true,
  });

  CrChatRead.bulkCreate(
    unreadMessages.map((unreadMessage) => ({
      userId: loginUserId,
      messageId: unreadMessage.id,
    })),
  );

  return respondSuccess('setted as read successfully');
};
