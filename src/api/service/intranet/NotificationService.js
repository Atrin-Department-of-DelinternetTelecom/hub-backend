'use strict';

const { GlobalNotificationsHistory, MoozaicUser } = require('@models').moozaic;

const { User } = require('@models').system;

const socket = require('@lib/socket');

const { v4: uuidv4 } = require('uuid');

const { commands: _commands } = require('@constants/ws');

const notificationCommands = _commands.notification;

const { CrNotificationPreference, InvoiceClient, CrTask } =
  require('@models').intranet;

const CrmTaskService = require('./CrmTaskService');

const {
  getPushMetadata,
} = require('@service/intranet/NotificationHelperService');

const { getSettings } = require('@service/intranet/NotificationConfigService');

const { Op } = require('sequelize');

const _ = require('lodash');

const {
  getEventEmitter,
  GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION,
} = require('../../../lib/emitter');
const InvoiceClientService = require('./InvoiceClientService');
const { TemplatesMail } = require('./TemplatesMailService');
const { getTransporter, isEnable, senders } = require('@lib/mailer');

exports.sendArray = ({
  userId,
  concept,
  app,
  uniqueId,
  image,
  dontRefreshClients,
  aditionalPushData,
  template,
  textVars = {},
  title = '',
  icon,
  text,
  logedUserId,
}) => {
  textVars.title = title ? title : textVars.title;
  textVars.text = text ? text : textVars.text;
  return exports.send(
    userId,
    concept,
    app,
    textVars,
    image,
    aditionalPushData,
    template ? template : 'basic',
    icon,
    uniqueId,
    dontRefreshClients,
    logedUserId,
  );
};

exports.send = async (
  userId,
  concept,
  app,
  textVars,
  image,
  aditionalPushData,
  template = 'basic',
  icon,
  uniqueId,
  dontRefreshClients,
  logedUserId,
) => {
  const user = await MoozaicUser.findByPk(userId);
  if (!user) {
    return {
      success: false,
      reason: `user not found (${userId})`,
    };
  }
  const hubUser = await User.findOne({ where: { email: user.email } });

  concept = concept ? concept : 'standard';
  const isStandard = concept === 'standard';
  app = app ? app : isStandard ? 'common' : 'public'; //TODO check value of APP_CODE contrant in php
  if (!uniqueId) {
    return {
      success: false,
      reason: `no unique id provided ${app}/${concept}/${userId} (${JSON.stringify(
        aditionalPushData,
      )})`,
    };
  }

  aditionalPushData.key = aditionalPushData.key
    ? aditionalPushData.key
    : concept;

  const check = await CrmTaskService.checkUserPreferences({
    userId,
    concept,
    app,
    aditionalPushData,
  });

  // get needed preferences
  const preferenceIds = check.preferences.map((prefrence) => prefrence.id);
  const allNotificationHistory = {};
  (
    await GlobalNotificationsHistory.findAll({
      where: {
        uniqueId,
        usedRueId: preferenceIds,
      },
    })
  ).forEach((notificationHistory) => {
    allNotificationHistory[notificationHistory.usedRueId] = notificationHistory;
  });

  const userToRefresh = {};
  for (const preference of check.preferences) {
    const exist = allNotificationHistory[preference.id];
    const checkPass = check.usedRules[preference.id];
    const autoRemoveBell = preference.autoRemoveBell === 1;

    let create = false;
    if (checkPass) {
      if (!exist) {
        create = true;
      }

      if (exist && exist.cardRead && autoRemoveBell) {
        exist.cardRead = false;
        userToRefresh[userId] = true;
      }
    } else {
      if (exist && !exist.cardRead && autoRemoveBell) {
        exist.cardRead = false;
        userToRefresh[userId] = true;
      }
    }

    const settings = await getSettings(concept, app, user.language);

    let subject = textVars.title ? textVars.title : settings.subject;
    let text = textVars.text ? textVars.text : settings.text;

    for (const key in textVars) {
      const textVar = textVars[key];
      text = text.replace(`%${key}%`, textVar);
      subject = subject.replace(`%${key}%`, textVar);
    }
    let isRescued = false;
    if (!create) {
      if (exist) {
        exist.subject = subject;
        exist.text = text;
        exist.image = image;
        exist.icon = JSON.stringify(icon);
        exist.metadata = JSON.stringify(aditionalPushData);
        await exist.save();
        userToRefresh[userId] = true;
      }
      isRescued = true;
    } else {
      const newHistory = await GlobalNotificationsHistory.create({
        uniqueId,
        subject,
        text,
        userId,
        concept,
        app,
        image,
        icon: JSON.stringify(icon),
        cardRead: 0,
        metadata: JSON.stringify(aditionalPushData),
        usedRueId: preference.id,
      });
      allNotificationHistory[preference.id] = newHistory;
      if (hubUser) {
        socket.emitIn(
          hubUser.id,
          `${_commands.new_notification}/intranet`,
          newHistory.get({ plain: true }),
        );
        getEventEmitter().emit(
          GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION,
          {
            concept,
            subject,
            text,
            app: 'crm',
            creator_id: logedUserId,
            owner_id: hubUser.id,
            read: 1, //TODOALI remove this after full migrate to hub system
          },
          {
            ...aditionalPushData,
            intranet_notification_id: newHistory.id,
          },
        );
      }

      userToRefresh[userId] = true;
    }

    if (
      preference.push === 1 &&
      !dontRefreshClients &&
      userId !== logedUserId
    ) {
      const ret = await getPushMetadata({
        userId,
        aditionalPushData,
      });
    }

    if (preference.email && !dontRefreshClients && !isRescued & isEnable) {
      const body = await getEmailBody(aditionalPushData.taskId, text);
      const templateMail = new TemplatesMail();
      await templateMail.init(userId);
      getTransporter().sendMail({
        to: user.email,
        subject: subject.replace('<br>', ' - ').replace(/(<([^>]+)>)/gi, ''),
        html: await templateMail.getBody(template, { text: body }),
        from: senders.default,
      });
    }
  }
  return {
    success: true,
  };
};

/**
 * attach additional info to email content
 * @param {number} taskId id of task to get additional data
 * @param {string} text email content
 * @returns {Promise<string>}
 */
const getEmailBody = async (taskId, text) => {
  const task = await CrTask.findByPk(taskId, {
    include: { model: InvoiceClient, as: 'invoice_client' },
  });
  const name = InvoiceClientService.getStringName(task.invoice_client);
  const phone = task.invoice_client.phone;
  const emailBody = `<h2>${name}</h2>(${phone})<br><hr>${text}`;
  return emailBody;
};

/**
 * find all notificatoins filtered by unique key
 * @param {string} uniqueKey unique string to find notification records
 * @returns {Promise<object[]>} array of notifications models
 */
exports.getNotiIdsByUniqueIdLike = async (uniqueKey) => {
  return GlobalNotificationsHistory.findAll({
    where: {
      uniqueId: {
        [Op.like]: `%${uniqueKey}%`,
      },
    },
    include: {
      model: CrNotificationPreference,
      as: 'preference',
      required: false,
    },
  });
};

/**
 * set as read notification based on list of notifications in input params and do some operation
 * @param {Array<object>|Array<number>|string|null} notiIds id of notification for set read
 * @param {boolean} deletableOnly flag for filter notification
 * @param {boolean} dontRefresh flag for operation after set as read in notification
 * @param {number} loginUserId id of user that loged in (who called this function)
 */
exports.setRead = async (
  notiIds = null,
  deletableOnly = false,
  dontRefresh = false,
  loginUserId,
) => {
  let notifs = [];
  if (Array.isArray(notiIds) && !notiIds.length) {
    return { success: true };
  }

  if (Array.isArray(notiIds) && typeof notiIds[0] === 'object') {
    notifs = notiIds;
  } else {
    let where = {};
    if (notiIds === -1) {
      where = { userId: loginUserId, cardRead: 0 };
    } else {
      where = {
        id: notiIds,
        cardRead: 0,
      };
      if (notiIds.length === 0) {
        delete where.id;
      }
    }
    notifs = await GlobalNotificationsHistory.findAll({
      where,
      include: {
        model: CrNotificationPreference,
        as: 'preference',
        required: false,
      },
    });
  }

  const userIds = {};
  for (const notif of notifs) {
    if (deletableOnly && _.get(notif, 'prefenrece.autoRemoveBell', 0)) {
      continue;
    }
    if (!userIds[notif.userId]) userIds[notif.userId] = [];
    notif.cardRead = 1;
    await notif.save();
    userIds[notif.userId].push(notif);
  }

  await sendUpdateNotificationSignal(userIds);

  return { success: true };
};

/**
 * get list of users with their changes and send their change throw websocket
 * @param {object} usersWithChanges object with key userId and value array of related notifications
 */
const sendUpdateNotificationSignal = async (usersWithChanges) => {
  const users = {};
  (
    await User.findAll({
      where: { userId: Object.keys(usersWithChanges) },
    })
  ).forEach((user) => {
    users[users.userId] = {
      global_user_id: user.id,
      changes: usersWithChanges[users.userId],
    };
  });

  for (const change of Object.values(users)) {
    socket.emitIn(change.global_user_id, notificationCommands.update, {
      changes: change.changes,
    });
  }
};
