'use strict';

const {
  moozaic: { MoozaicUsersLinkService },
  system: { User },
} = require('@models');

const { GoogleCalendar } = require('../google/Calendar');

const {
  respondSuccess,
  respondNotFound,
  respondBadRequest,
} = require('@utils/response');

const { serialize } = require('locutus/php/var');

const CrmGooGleService = require('./CrmGoogleService');

const moment = require('moment');

/**
 * get list of all services related to this user
 * @param {number} userId get state of which userId
 * @returns {object} list of services
 */
exports.getState = async (userId) => {
  const userLink = await MoozaicUsersLinkService.findOne({
    where: {
      userId,
    },
    raw: true,
  });

  const calendar = new GoogleCalendar(userId);
  if (await calendar.isAvailable()) {
    const userInfo = (await calendar.getUserProfile()).data;
    return respondSuccess({
      google: {
        ...userLink,
        userInfo,
      },
    });
  }
  return respondSuccess(`calendar not available for this user`);
};

/**
 * get auth url for calendar
 * @param {number} userId intranet userId for google auth
 * @returns {string}
 */
exports.getGoogleAuthUrl = async (userId) => {
  const calendar = new GoogleCalendar(userId);
  return respondSuccess({
    url: calendar.getUrlToAuth(),
  });
};

exports.postLink = async (body, userId) => {
  // remove last links
  await MoozaicUsersLinkService.update(
    {
      status: 0,
    },
    {
      where: { userId },
    },
  );

  //serialize and add token
  const serializedToken = serialize(JSON.parse(body.token));
  const newMoozaicUsersLink = await MoozaicUsersLinkService.create({
    service: 'google',
    userId,
    externalUserId: body.externalUserId,
    token: serializedToken,
  });

  return respondSuccess(newMoozaicUsersLink);
};

/**
 * disconnect related user info
 * @param {number} userId disconnect related to userId
 * @returns {Promise<{object}>}
 */
exports.disconnect = async (userId) => {
  return respondSuccess('successfully dissconnected');
};

/**
 * get list of google events in a period
 * @param {number} global_user_id id of global user
 * @param {{start_date:string,end_date:string}} period start and end dates for get list of events
 * @returns {Promise<{code:string,events:object[]}>}
 */
exports.getGoogleEventsByGfUserId = async (global_user_id, period) => {
  if (
    !moment(period.start_date).isValid() ||
    !moment(period.end_date).isValid()
  )
    return respondBadRequest('invalid date');

  const globalUser = await User.findByPk(global_user_id);
  if (!globalUser) return respondNotFound(`user not found`);

  const calendar = new GoogleCalendar(globalUser.userId);
  if (!(await calendar.isAvailable()))
    return respondSuccess({ code: 'not_available', events: [] });

  const eventsResponse = await calendar.getEventsBetweenDates(
    period.start_date,
    period.end_date,
  );

  return respondSuccess({
    code: 'success',
    events: eventsResponse?.data?.items ?? [],
  });
};
