'use strict';

const { CrTask, CrChat, CrChatRead } = require('@models').intranet;

const { MoozaicUser } = require('@models').moozaic;

const { GoogleCalendar } = require('../google/Calendar');

const moment = require('moment');

const { intranet } = require('@lib/knex');

const { DateTime } = require('luxon');

/**
 * Sync event display date columns for the calendar
 *
 *
 * @param {object} eventInfo related info for sending google event
 * @param {number} loginUserId id of user that logined
 */
exports._syncEvent = async (eventInfo, loginUserId) => {
  const { eventId } = eventInfo;
  const event = await CrTask.findOne({
    where: { id: eventId, status: [0, 1] },
  });

  if (event && event.executed !== '1') {
    const { initDate, endDate } = eventDates(event);
    await event.update({
      displayFrom: DateTime.fromJSDate(initDate.toDate()).toSQL({
        includeOffset: false,
      }),
      displayUntil: DateTime.fromJSDate(endDate.toDate()).toSQL({
        includeOffset: false,
      }),
    });
  }
};

const eventDates = (event) => {
  const dates = {
    initDate: moment().startOf('day'),
    endDate: moment().startOf('day').add(1, 'day'),
  };

  if (event.duration) {
    dates.initDate =
      event.previsionDate && moment(event.previsionDate).isValid()
        ? moment(event.previsionDate)
        : moment();
    dates.endDate = dates.initDate.clone().add(event.duration, 'minutes');
  }

  return dates;
};

/**
 * select last {max} messages with filter {filter} and attach another related data (user info and ...)
 * @param {string} filter filter messages => select gouop of messages by filter. example:chatId:3223
 * @param {number} max get number of lasst messages
 * @param {number} loginUserId id of user that logined
 * @return {object} object contain list of messages and metadata
 * @example
 * {
 *  messages:[],
 *  metadata:[]
 * }
 */
exports.getFilteredMessage = async (filter, max = 999, loginUserId) => {
  /**this is selectFull method in php */
  const messages = await CrChat.findAll({
    where: {
      filter,
    },
    limit: max,
    order: [['creationDate', 'desc']],
    include: [
      {
        model: CrChatRead,
        as: 'read_info',
        where: {
          userId: loginUserId,
        },
        required: false,
      },
      {
        model: MoozaicUser,
        as: 'from_user',
        required: false,
      },
    ],
  });

  /** set as seen */
  const unReadMessages = await CrChat.findAll({
    where: {
      filter,
    },
    include: [
      {
        model: CrChatRead,
        as: 'read_info',
        where: {
          status: [0, null],
          userId: loginUserId,
        },
        required: true,
      },
    ],
  });

  const setAsSeen = [];
  unReadMessages.forEach((message) => {
    setAsSeen.push({
      messageId: message.id,
      userId: loginUserId,
    });
  });
  CrChatRead.bulkCreate(setAsSeen);
  /** end set as seen */

  const metadata = {};
  for (const referer of filter.split(',')) {
    const [refererKey, refererId] = referer.split(':');
    const crmTask = await CrTask.findByPk(refererId);
    metadata[refererKey] = {
      clientId: crmTask.clientId,
      taskId: crmTask.id,
    };
  }

  return {
    metadata,
    messages,
  };
};
