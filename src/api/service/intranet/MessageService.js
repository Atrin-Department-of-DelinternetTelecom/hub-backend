'use strict';

const {
  intranet: { CrChat, CrTaskUserXref, CrmUser, CrTask },
} = require('@models');

const { MoozaicUser } = require('@models').moozaic;

const CrmGoogleService = require('./CrmGoogleService');

const NotificationService = require('./NotificationService');

const CrmNotificationsPreferenceService = require('./CrmNotificationsPreferenceService');

const socket = require('@lib/socket');

const { commands } = require('@constants/ws');
const CrmTaskService = require('./CrmTaskService');

/**
 * insert message to messages table and trigger some websocket and notification and google calendar event
 * @param {string} text content of message that we want to send or save
 * @param {string} filter is a key and definition of resourse of this message(belongs to which entities)
 * @param {number | null} fromUserId id of sender this message
 * @param {number | null} loginUserId id of user that logined
 * @returns {Promise<any>} status of sending this message
 */
exports.sendMessage = async (text, filter, fromUserId = null, loginUserId) => {
  const message = text.replace('&nbsp;', ' ');
  const newMessage = await CrChat.create({
    text: message,
    filter,
    fromUserId,
  });
  await exports.publishNewMessage(newMessage.id);

  // each filter used for one resourse, but we can pass multiple filter => crmTask:12,crmTask:13 and this is the reason we split with ,
  if (filter) {
    const referers = filter.split(',');
    for (const referer of referers) {
      const [refrerKey, refererId] = referer.split(':');
      await exports.onNewMessage(
        {
          id: newMessage.id,
          fromUserId,
          text: newMessage.text,
          filter,
          refererId,
        },
        loginUserId,
      );
    }
  }
  return {
    success: true,
    messageId: newMessage.id,
  };
};

/**
 * send notification to related users and put inside google calendar
 * @param {object} new_message created new message information
 * @param {number} loginUserId id of user that logined
 * @example
 *   {
 *      id:4,
 *      fromUserId:2338,
 *      text:'hi, what did u do',
 *      filter:'crmTask:12',
 *      refererId:3
 *   }
 */
exports.onNewMessage = async (new_message, loginUserId) => {
  try {
    const { text, filter, refererId } = new_message;
    let userRelatedToCrmTaskIds = [];
    const taskId = parseInt(refererId) || 0;
    if (taskId) {
      // after new message, related crm_task should update (last modified should change)
      const relatedTasks = await CrTask.findAll({ where: { chatId: filter } });
      for (const crmTask of relatedTasks) {
        crmTask.changed('updateDate', true);
        crmTask.updateDate = new Date();
        await crmTask.save();
      }
      userRelatedToCrmTaskIds = (
        await CrTaskUserXref.findAll({
          where: { taskId },
          include: {
            model: CrmUser,
            as: 'user',
          },
        })
      ).map((userTask) => userTask.user.userId);
    }

    const usersForSendNotification =
      await CrmNotificationsPreferenceService.selectUsersSuscribedToUserid(
        userRelatedToCrmTaskIds,
        'new_message',
      );

    const loginedUser = await MoozaicUser.findByPk(loginUserId);

    for (const userId of usersForSendNotification) {
      await NotificationService.sendArray({
        userId,
        concept: 'new_message',
        app: 'crm',
        textVars: { userName: loginedUser.name, title: text },
        icon: {
          cls: 'fa fa-comments-o',
          style: 'background-color: #555;',
        },
        aditionalPushData: {
          key: 'crmTask',
          taskId,
          group: `chat:crmTask_${taskId}`,
          chatKey: filter,
        },
        logedUserId: loginUserId,
      });
    }

    await CrmGoogleService._syncEvent(
      {
        eventId: refererId,
      },
      loginUserId,
    );
  } catch (error) {
    console.log(error);
  }
};

exports.publishNewMessage = async (message_id) => {
  const newMessage = await CrChat.findByPk(message_id, {
    include: { model: MoozaicUser, as: 'from_user', required: false },
  });
  const socketData = {};
  socketData[newMessage.filter] = newMessage;
  socket.emit(commands.intranetMessage.update, socketData);
};
