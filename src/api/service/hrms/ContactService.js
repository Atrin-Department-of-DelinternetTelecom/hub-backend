'use strict';

const { EmployeeContact, User } = require('@models').system;
const status = require('http-status');
const { respondBadRequest } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete contact record by id
 *
 * id String id of contact of employee
 * returns Object
 **/
exports.deleteContactsId = async function (id) {
  return await findAndDelete(id, EmployeeContact);
};

/**
 * Your GET endpoint
 * get all contacts
 *
 * returns Object
 **/
exports.getContacts = async function (query) {
  return await getAllEntities(query, EmployeeContact);
};

/**
 * Your GET endpoint
 * get all contacts record that related by user by id of user
 *
 * id String id of user
 * returns Object
 **/
exports.getUserContactsId = async function (id) {
  if (typeof id == 'undefined' || (await User.findByPk(id)) === null) {
    return respondBadRequest('user not found');
  }
  return await EmployeeContact.findAll({
    where: {
      employee_id: id,
    },
  });
};

/**
 * Your GET endpoint
 * get single contact record by id
 *
 * id String id of contact of employee
 * returns Object
 **/
exports.getContactsId = async function (id) {
  return await findAndGet(id, EmployeeContact);
};

/**
 *
 * add new contact for an employee(or user of the system)
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postContacts = async function (body) {
  if (
    typeof body.employee_id == 'undefined' ||
    (await User.findByPk(body.employee_id)) === null
  ) {
    return respondBadRequest('user not found');
  }
  return respondCreated(await EmployeeContact.create(body));
};

/**
 *
 * update contact record by id
 *
 * id String id of contact of employee
 * body Body in this example we want to change work phone. (optional)
 * returns Object
 **/
exports.putContactsId = async function (id, body) {
  return await findAndUpdate(id, body, EmployeeContact);
};
