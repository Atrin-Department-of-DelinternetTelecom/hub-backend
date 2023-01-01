// @ts-check
'use strict';

const { default: axios } = require('axios');
const config = require('@config');
const { respondSuccess } = require('@utils/response');

const googleApiKey = config.get('hrms.googleApiKey', null);

const BASE_CALENDAR_URL = 'https://www.googleapis.com/calendar/v3/calendars';

const BASE_CALENDAR_ID_FOR_PUBLIC_HOLIDAY =
  'holiday%40group.v.calendar.google.com';

const CALENDAR_REGION = 'en.spain';

exports.fetchHolidaysInInterval = async function (startTime, endTime) {
  let url = `${BASE_CALENDAR_URL}/${CALENDAR_REGION}%23${BASE_CALENDAR_ID_FOR_PUBLIC_HOLIDAY}/events?key=${googleApiKey}`;
  if (startTime && startTime.length) url = url.concat(`&timeMin=${startTime}`);

  if (endTime && endTime.length) url = url.concat(`&timeMax=${endTime}`);

  const holidays = await axios.get(url);
  return respondSuccess(holidays.data);
};
