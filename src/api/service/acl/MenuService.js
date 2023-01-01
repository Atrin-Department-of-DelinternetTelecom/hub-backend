'use strict';

const { AclMenu, AclApp } = require('@models').system;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const { respondSuccess, respondNotFound } = require('@utils/response');

const {
  getEventEmitter,
  SETTING_002_UPDATE_APP_JSON_ADD_MENU,
  SETTING_004_DELETE_APP_JSON_ADD_MENU,
} = require('../../../lib/emitter');

const _ = require('lodash');

/**
 *
 * delete a menu record by id
 *
 * id String
 * returns Object
 **/
exports.deleteMenusId = async function (id) {
  const menu = await AclMenu.findByPk(id, {
    include: {
      model: AclApp,
      as: 'app',
    },
  });
  if (_.isNull(menu)) {
    return respondNotFound(`menu with id ${id} not found`);
  }

  await AclMenu.destroy({
    where: {
      id,
    },
  });

  getEventEmitter().emit(
    SETTING_004_DELETE_APP_JSON_ADD_MENU,
    menu.app.name,
    menu.app.id,
    menu.name,
    menu.id,
  );

  return respondSuccess('menu deleted.');
};

/**
 * Your GET endpoint
 * get all menu(information) record
 *
 * returns Object
 **/
exports.getMenus = async function (query) {
  return await getAllEntities(query, AclMenu);
};

/**
 * Your GET endpoint
 * get single menu record by id
 *
 * id String
 * returns Object
 **/
exports.getMenusId = async function (id) {
  return await findAndGet(id, AclMenu);
};

/**
 *
 * add a menu record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postMenus = async function (body, creator_id) {
  body.creator_id = creator_id;
  const response = await createCatch(body, AclMenu);
  const app = await AclApp.findByPk(body.acl_app_id);
  if (_.isNull(app)) {
    return respondNotFound(`app with id ${body.acl_app_id} not found`);
  }
  getEventEmitter().emit(
    SETTING_002_UPDATE_APP_JSON_ADD_MENU,
    app.name,
    body.acl_app_id,
    response.payload.data.name,
    response.payload.data.id,
    creator_id,
  );
  return response;
};

/**
 *
 * update a menu record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected menu (optional)
 * returns Object
 **/
exports.putMenusId = async function (id, body) {
  return await findAndUpdate(id, body, AclMenu);
};
