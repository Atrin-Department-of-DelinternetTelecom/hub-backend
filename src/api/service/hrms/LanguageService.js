'use strict';

const { EmployeeLanguage, User } = require('@models').system;
const status = require('http-status');
const { respondBadRequest } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete language record by id
 *
 * id String id of table language record
 * returns Object
 **/
exports.deleteLanguagesId = async function (id) {
  return await findAndDelete(id, EmployeeLanguage);
};

/**
 * Your GET endpoint
 * get all language records (each record related to an employee or user)
 *
 * returns Object
 **/
exports.getLanguages = async function (query) {
  return await getAllEntities(query, EmployeeLanguage);
};

/**
 * Your GET endpoint
 * get all language records that related by user by id of user
 *
 * id String id of user
 * returns Object
 **/
exports.getUserLanguagesId = async function (id) {
  if (typeof id == 'undefined' || (await User.findByPk(id)) === null) {
    return {
      code: status.BAD_REQUEST,
      payload: {
        message: 'user id not found',
      },
    };
  }
  return await EmployeeLanguage.findAll({
    where: {
      employee_id: id,
    },
  });
};

/**
 * Your GET endpoint
 * get single education record by id
 *
 * id String id of contact of employee
 * returns Object
 **/
exports.getLanguagesId = async function (id) {
  return await findAndGet(id, EmployeeLanguage);
};

/**
 *
 * add new language to a user or employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postLanguages = async function (body) {
  if (
    typeof body.employee_id == 'undefined' ||
    (await User.findByPk(body.employee_id)) === null
  ) {
    return respondBadRequest('user not found');
  }
  return respondCreated(await EmployeeLanguage.create(body));
};

/**
 *
 * update language record by id
 *
 * id String id of table language record
 * body Body  (optional)
 * returns Object
 **/
exports.putLanguagesId = async function (id, body) {
  return await findAndUpdate(id, body, EmployeeLanguage);
};
