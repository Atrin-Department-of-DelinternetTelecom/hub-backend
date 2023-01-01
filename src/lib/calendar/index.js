'use strict';

require('dotenv').config();
const { google } = require('googleapis');

const config = require('@config');

// get configs for google calendar api
const { googleCalendarApi } = require('@config');
const CALENDAR_CREDENTIALS = JSON.parse(config.get('index.calendarConfig')).web;
const calendar_id = CALENDAR_CREDENTIALS.CALENDAR_ID;

//calendar object to use for actions(insert event ...)
let calendar = null;

// auth object for authenticate to insert event or ather action on specific calendar
let auth = null;

/**
 * connect and authenticate to google calendar base on config and env file
 */
exports.connect = () => {
  calendar = google.calendar({ version: 'v3' });
  auth = new google.auth.JWT(
    CALENDAR_CREDENTIALS.client_id,
    null,
    CALENDAR_CREDENTIALS.private_key,
    googleCalendarApi,
  );
};

/**
 * add an event to related calendar
 * @param {object} event data for put inside calendar
 * @example
 *  {
 *   summary:'this is summary',
 *   description:'this is description',
 *   start:{
 *     dateTime:'2008-03-07T17:06:02.000Z',
 *     timezone:'+04:30'
 *   },
 *   end:{
 *     dateTime:'2008-03-07T18:06:02.000Z',
 *     timezone:'+04:30'
 *   }
 *  }
 */
exports.insertEvent = async (event) => {
  try {
    const response = await calendar.events.insert({
      auth,
      calendarId: calendar_id,
      resource: event,
    });
  } catch (error) {
    console.log(error);
  }
};
