'use strict';

// read credential data for auth
require('dotenv').config();

const moment = require('moment');

//google libs for use authenticate and google calendar
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const config = require('@config');

// for encode and decode data form database
const { unserialize } = require('locutus/php/var');
const { CALENDAR, PROFILE } = require('./permissions');

// get calendar Ids
const { GlobalGoogleCalendar, CrmUser } = require('@models').intranet;

// get token data for authenticate
const { MoozaicUsersLinkService } = require('@models').moozaic;

// get config
const getCredential = () => {
  return JSON.parse(config.get('index.calendarConfig')).web;
};

/**
 * @class
 */
exports.GoogleCalendar = class GoogleCalendar {
  /**
   * @constructor
   * create new GoogleCalendar class and get id to access related information of user
   * @param {number} userId id of user to create new calendar object
   */
  constructor(userId) {
    this.userId = userId;
    this.calendarKey = `crm:90_${userId}`;
  }

  /**
   * insert event to google calendar
   * @param {object} event event object with google format to insert event inside calendar
   * @returns response and result of creating new envet
   */
  async addEvent(event) {
    try {
      return await this.calendar.events.insert({
        auth: this.oAuth2Client,
        calendarId: this.calendarId,
        resource: event,
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * update an event of google calendar
   * @param {object} event event object with google format to update existing event in calendar
   * @param {string} event_id id of event inside google calendar that we want to update
   * @returns response and result of update event
   */
  async updateEvent(event, event_id) {
    try {
      return await this.calendar.events.update({
        auth: this.oAuth2Client,
        calendarId: this.calendarId,
        eventId: event_id,
        resource: event,
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * delete a google event by id
   * @param {string} event_id id of a google event to delete
   * @returns response and result of delete event
   */
  async deleteEvent(event_id) {
    try {
      return await this.calendar.events.delete({
        auth: this.oAuth2Client,
        calendarId: this.calendarId,
        eventId: event_id,
      });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * checkt credentials,id of calendar, token and try to request; if all ok, return true,else return false.
   * @param {object} calendarOption some option to check if calendar entity avalable or no
   * @returns {boolean} result of availeble this calendar object
   */
  async isAvailable(calendarOption = null) {
    try {
      const credentials = getCredential();
      const { client_secret, client_id, redirect_uris } = credentials;

      this.oAuth2Client = new OAuth2(
        client_id,
        client_secret,
        redirect_uris[0],
      );

      // get userLink(to access token data of this user)
      const userLink = await MoozaicUsersLinkService.findOne({
        where: {
          userId: this.userId,
        },
      });

      if (!userLink) {
        console.error(
          `[Calendar.js][isAvailable] missing the Moozaic user [userId: ${this.userId}]`,
        );
        return false;
      }
      const token = unserialize(userLink.token);
      this.oAuth2Client.setCredentials(token);

      this.calendar = google.calendar({
        version: 'v3',
        auth: this.oAuth2Client,
      });

      // get google calendar data related to this user
      let googleCalendar = await GlobalGoogleCalendar.findOne({
        where: {
          key: this.calendarKey,
        },
      });

      if (!googleCalendar) {
        if (!calendarOption?.userId || !calendarOption?.name) {
          calendarOption = await this.buildConstructorByKey(this.calendarKey);
        }

        let newCaledarId = undefined;
        const foundCalendar = await this.findCalendar();
        if (!foundCalendar) {
          const createdCalendar =
            (
              await this.calendar.calendars.insert({
                requestBody: {
                  description: `<key>${this.calendarKey}</key>`,
                  summary: calendarOption.name,
                },
              })
            )?.data ?? {};
          newCaledarId = createdCalendar.id;
        } else {
          newCaledarId = foundCalendar.id;
        }

        googleCalendar = await GlobalGoogleCalendar.create({
          key: this.calendarKey,
          googleCalendarId: newCaledarId,
          userId: this.userId,
        });
      }
      this.calendarId = googleCalendar.googleCalendarId;

      //try to get calendar from google
      await this.calendar.calendars.get({
        calendarId: this.calendarId,
      });

      return true;
    } catch (error) {
      console.error(`[Calendar.js][isAvailable] ${error.message}`);
      return false;
    }
  }

  async findCalendar() {
    const allCalendars = await this.getAllCalendars();
    let findedCalendar = undefined;
    for (const calendar of allCalendars) {
      if (calendar.description === `<key>${this.calendarKey}</key>`) {
        findedCalendar = calendar;
      }
    }
    return findedCalendar;
  }

  async getAllCalendars(nextPageToken, calendars = []) {
    return new Promise((resolve, reject) => {
      this.calendar.calendarList.list(
        {
          pageToken: nextPageToken,
        },
        (err, res) => {
          if (err) return reject(err);

          const fullCalendarList = [...calendars, ...res.data.items];

          if (res.data.nextPageToken) {
            // recursively fetch the next page
            this.getAllCalendars(res.data.nextPageToken, fullCalendarList)
              .then(resolve)
              .catch(reject);
          } else {
            resolve(fullCalendarList);
          }
        },
      );
    });
  }

  async deleteCalendar() {
    const googleCalendar = await GlobalGoogleCalendar.findOne({
      where: { userId: this.userId },
    });
    if (googleCalendar) {
      try {
        this.calendar.calendars.delete({
          calendarId: googleCalendar.googleCalendarId,
        });
      } catch (e) {
        console.log(e);
      }

      if (googleCalendar) {
        googleCalendar.status = 0;
        await googleCalendar.save();
      }
    }
  }

  /**
   * build some data from calendar key
   * @param {string} calendarKey calendar key with format @example crm:90_2338
   * @return {Promise<{userId:number,name:string}>}
   */
  async buildConstructorByKey(calendarKey) {
    const userId = calendarKey.split(':')[1].split('_')[1];
    const user = await CrmUser.findOne({ where: { userId } });
    return {
      userId,
      name: `${user.nickName} CRM`,
    };
  }

  /**
   * get information of authed user
   * @returns information object of authed user
   */
  async getUserProfile() {
    const oauth2 = google.oauth2({
      auth: this.oAuth2Client,
      version: 'v2',
    });
    return oauth2.userinfo.get();
  }

  /**
   * get url to auth with google account
   * @return {string}
   */
  getUrlToAuth() {
    //get config
    const credentials = getCredential();
    const { client_secret, client_id, redirect_uris } = credentials;

    const connection = new OAuth2(client_id, client_secret, redirect_uris[0]);
    return connection.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [CALENDAR, PROFILE],
      state: `${this.userId}`,
    });
  }

  /**
   * request to google apis to get calendar events
   * @param {string} startDate start of period date
   * @param {string} endDate end of period date
   * @returns {Promise<object>} response info
   */
  async getEventsBetweenDates(startDate, endDate) {
    return this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: moment(startDate).startOf('day').format(),
      timeMax: moment(endDate).endOf('day').format(),
    });
  }

  async getEvents(maxResults = 1000, page) {
    return this.calendar.events.list({
      calendarId: this.calendarId,
      maxResults,
      pageToken: page,
    });
  }

  async allEvents() {
    const events = [];
    let nextPageToken;

    do {
      const { data } = await this.getEvents(1000, nextPageToken);
      nextPageToken = data.nextPageToken;
      if (data.items.length) {
        events.push(data.items);
      }
    } while (nextPageToken);

    return events.flat().filter((record) => record);
  }
};
