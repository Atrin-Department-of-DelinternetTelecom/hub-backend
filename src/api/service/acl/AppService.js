'use strict';

const { AclApp } = require('@models').system;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const { respondSuccess, respondNotFound } = require('@utils/response');

const {
  getEventEmitter,
  SETTING_001_UPDATE_APP_JSON_ADD_APP,
  SETTING_003_DELETE_APP_JSON_ADD_APP,
} = require('../../../lib/emitter');

const _ = require('lodash');

/**
 *
 * delete a app record by id
 *
 * id String
 * returns Object
 **/
exports.deleteAppsId = async function (id) {
  const app = await AclApp.findByPk(id);
  if (_.isNull(app)) {
    return respondNotFound(`app with id ${id} not found`);
  }

  await AclApp.destroy({
    where: {
      id,
    },
  });

  getEventEmitter().emit(SETTING_003_DELETE_APP_JSON_ADD_APP, app.name, app.id);

  return respondSuccess('app deleted.');
};

/**
 * Your GET endpoint
 * get all app(information) record
 *
 * returns Object
 **/
exports.getApps = async function (query) {
  return await getAllEntities(query, AclApp);
};

/**
 * Your GET endpoint
 * get single app record by id
 *
 * id String
 * returns Object
 **/
exports.getAppsId = async function (id) {
  return await findAndGet(id, AclApp);
};

/**
 *
 * add a app record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postApps = async function (body, creator_id) {
  body.creator_id = creator_id;
  const response = await createCatch(body, AclApp);
  getEventEmitter().emit(
    SETTING_001_UPDATE_APP_JSON_ADD_APP,
    response.payload.data.name,
    response.payload.data.id,
    creator_id,
  );
  return response;
};

/**
 *
 * update a app record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected app (optional)
 * returns Object
 **/
exports.putAppsId = async function (id, body) {
  return await findAndUpdate(id, body, AclApp);
};
