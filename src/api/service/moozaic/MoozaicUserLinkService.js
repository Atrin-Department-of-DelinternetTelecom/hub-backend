'use strict';
const {
  moozaic: { MoozaicUsersLinkService },
  intranet: { GlobalGoogleCalendar },
  system: { User },
} = require('@models');

const { respondCreated, respondBadRequest } = require('@utils/response');

const { serialize } = require('locutus/php/var');

const { google } = require('googleapis');

const { GoogleCalendar } = require('../google/Calendar');

const config = require('@config');

const CREDENTIALS = JSON.parse(config.get('index.calendarConfig')).web;

const { getAllEntities } = require('@utils/request-handler');

exports.postMoozaicUserLink = async (code, userId) => {
  const { client_secret, client_id, redirect_uris } = CREDENTIALS;
  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  );
  try {
    const response = await oauth2Client.getToken(code);
    oauth2Client.setCredentials({ access_token: response.tokens.access_token });
    const userInfo = await google
      .oauth2({
        auth: oauth2Client,
        version: 'v2',
      })
      .userinfo.get();
    const tokenString = serialize(response.tokens);
    const oldMoozaic = await MoozaicUsersLinkService.findOne({
      where: {
        userId,
      },
    });
    if (oldMoozaic) {
      oldMoozaic.status = 0;
      await oldMoozaic.save();
    }
    const newMoozaic = await MoozaicUsersLinkService.create({
      userId,
      token: tokenString,
      externalUserId: userInfo.data.id,
    });

    const calendar = new GoogleCalendar(userId);
    await calendar.isAvailable();

    return respondCreated('calendar added successfully');
  } catch (error) {
    return respondBadRequest(`could not create new user link`);
  }
};

exports.getMoozaicUserLink = async function (query) {
  return getAllEntities(query, MoozaicUsersLinkService, undefined, [
    {
      model: GlobalGoogleCalendar,
      as: 'calendarInfo',
      required: true,
    },
    {
      model: User,
      as: 'user',
      required: true,
    },
  ]);
};
