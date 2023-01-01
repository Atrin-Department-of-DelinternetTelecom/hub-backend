'use strict';

const { UnpaidSetting } = require('@models').intranet;

const {
  respondNotFound,
  respondBadRequest,
  respondCreated,
} = require('@utils/response');

const {
  getAllEntities,
  findAndUpdate,
  findAndDelete,
  findAndGet,
} = require('@utils/request-handler');

const { modelToJson } = require('@utils/tools');

const _ = require('lodash');

/**
 *
 * delete a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteUnpaidSettingsId = async function (id) {
  return await findAndDelete(id, UnpaidSetting);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getUnpaidSettings = async function (query) {
  return await getAllEntities(query, UnpaidSetting);
};

/**
 * Your GET endpoint
 * get single basic information record by id
 *
 * id String
 * returns Object
 **/
exports.getUnpaidSettingsId = async function (id) {
  return await findAndGet(id, UnpaidSetting);
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUnpaidSettings = async function (body) {
  return respondCreated(await UnpaidSetting.create(body));
};

/**
 *
 * update a basic information record by id
 *
 * id String
 * body Body in this example we want to change the
 * department of employee's basic information (optional)
 * returns Object
 **/
exports.putUnpaidSettingsId = async function (id, body) {
  return await findAndUpdate(id, body, UnpaidSetting);
};

exports.getSetting = async () => {
  const settings = await UnpaidSetting.findAll({
    raw: true,
  });

  if (settings.length === 0) {
    return;
  }

  return settings[0];
};

exports.ensureInvoiceFallbackSmsCounter = async function (invoice) {
  const setting = await exports.getSetting();
  if (!setting) {
    return false; //do what u want - setting not exist
  }
  return invoice.fallback_sms_counter < setting.fallback_sms_count;
};

exports.getDisabledNotifiers = async () => {
  const setting = await exports.getSetting();
  if (
    setting &&
    setting.disabled_notifiers &&
    setting.disabled_notifiers.length > 0
  )
    return setting.disabled_notifiers.split(',');
  return [];
};
