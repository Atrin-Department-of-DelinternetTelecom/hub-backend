'use strict';

const _ = require('lodash');

const moment = require('moment');

const { respondSuccess } = require('@utils/response');

exports.updateDates = async (LastUpdateModel) => {
  let last_update = await LastUpdateModel.findAll();

  const metadata = {
    categries_info: moment().format('YYYY-MM-DD HH:mm:ss'),
    categries_homepage: moment().format('YYYY-MM-DD HH:mm:ss'),
  };

  if (_.isNull(last_update[0]) || _.isUndefined(last_update[0])) {
    last_update = await LastUpdateModel.create({
      metadata,
    });
    return;
  }

  last_update[0].metadata = metadata;
  await last_update[0].save();
  return;
};

exports.getLastUpdate = async (LastUpdateModel) => {
  let last_update = await LastUpdateModel.findAll();
  if (_.isNull(last_update[0]) || _.isUndefined(last_update[0])) {
    const metadata = {
      categries_info: moment().format('YYYY-MM-DD HH:mm:ss'),
      categries_homepage: moment().format('YYYY-MM-DD HH:mm:ss'),
    };

    last_update = await LastUpdateModel.create({
      metadata,
    });
    return respondSuccess(last_update.metadata);
  }
  return respondSuccess(last_update[0].metadata);
};
