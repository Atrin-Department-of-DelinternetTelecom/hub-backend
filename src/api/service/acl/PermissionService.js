'use strict';

const { AclRelation, AclApp, AclMenu, AclAction } = require('@models').system;
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
} = require('@utils/response');
const _ = require('lodash');
/**
 *
 * delete a relation record by id
 *
 * id String
 * returns Object
 **/
exports.deletePermissionsId = async function (id) {
  return await findAndDelete(id, AclRelation);
};

/**
 * Your GET endpoint
 * get all relation(information) record
 *
 * returns Object
 **/
exports.getPermissions = async function (query) {
  return await getAllEntities(query, AclRelation, undefined, [
    { model: AclApp, as: 'app' },
    { model: AclMenu, as: 'menu' },
  ]);
};

/**
 * Your GET endpoint
 * get single relation record by id
 *
 * id String
 * returns Object
 **/
exports.getPermissionsId = async function (id) {
  return await findAndGet(id, AclRelation);
};

/**
 *
 * add a relation record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postPermissions = async function (body, creator_id) {
  const { acl_app_id, acl_menu_id } = body;

  if (!_.isNull(acl_menu_id) && !_.isUndefined(acl_menu_id)) {
    if (_.isNull(acl_app_id) || _.isUndefined(acl_app_id)) {
      return respondBadRequest('app_id must define');
    }
  }

  if (
    !_.isNull(acl_app_id) &&
    !_.isUndefined(acl_app_id) &&
    _.isNull(await AclApp.findByPk(acl_app_id))
  ) {
    return respondNotFound('app not found');
  }

  if (
    !_.isNull(acl_menu_id) &&
    !_.isUndefined(acl_menu_id) &&
    _.isNull(await AclMenu.findByPk(acl_menu_id))
  ) {
    return respondNotFound('menu not found');
  }

  body.creator_id = creator_id;
  const created = await AclRelation.create(body);
  // update global roles
  return respondCreated(created);
};

/**
 *
 * update a relation record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected role (optional)
 * returns Object
 **/
exports.putPermissionsId = async function (id, body) {
  const { acl_app_id, acl_menu_id } = body;

  if (!_.isNull(acl_menu_id) && !_.isUndefined(acl_menu_id)) {
    if (_.isNull(acl_app_id) || _.isUndefined(acl_app_id)) {
      return respondBadRequest('app_id must define');
    }
  }

  if (
    !_.isNull(acl_app_id) &&
    !_.isUndefined(acl_app_id) &&
    _.isNull(await AclApp.findByPk(acl_app_id))
  ) {
    return respondNotFound('app not found');
  }

  if (
    !_.isNull(acl_menu_id) &&
    !_.isUndefined(acl_menu_id) &&
    _.isNull(await AclMenu.findByPk(acl_menu_id))
  ) {
    return respondNotFound('menu not found');
  }

  const updated = await findAndUpdate(
    id,
    {
      acl_app_id,
      acl_menu_id,
    },
    AclRelation,
  );
  // update global roles
  await require('@service/acl/Roles').getRoles();
  return updated;
};
