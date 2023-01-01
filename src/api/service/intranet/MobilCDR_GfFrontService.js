'use strict';

const { GfAireCdrStatus } = require('@models').intranet;

const moment = require('moment');

const {
  respondBadRequest,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const { importDate } = require('./AireCdrService');

exports.reloadCdr = async (date) => {
  //check date is valid
  if (!date || !moment(date).isValid()) {
    return respondBadRequest(`invalid date of date format${date}`);
  }

  //find or create cdr status based on date
  date = moment(date).format('YYYY-MM-DD');
  const [aireCdrStatus] = await GfAireCdrStatus.findOrCreate({
    where: {
      date,
    },
    defaults: {
      date,
    },
  });

  if (!aireCdrStatus) {
    return respondNotFound(`aire cdr status for date ${date} not found.`);
  }

  aireCdrStatus.state = 'cueued';
  await aireCdrStatus.save();

  const result = await reloadCdr(aireCdrStatus, date);
  return respondSuccess(result);
};

const reloadCdr = async (aireCdrStatus, date) => {
  //change state of cdr status to import and calculate total object
  aireCdrStatus.state = 'started';
  aireCdrStatus.totals = '{}';
  await aireCdrStatus.save();

  //try to import and if process complete without error change state to done else change to error and save message
  try {
    const result = await importDate(aireCdrStatus, date);
    aireCdrStatus.state = 'done';
    await aireCdrStatus.save();
    return result;
  } catch (error) {
    aireCdrStatus.state = 'error';
    aireCdrStatus.lastMessage = error.message;
    await aireCdrStatus.save();
    return {
      success: false,
    };
  }
};
