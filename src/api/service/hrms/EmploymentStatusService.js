'use strict';

const { EmploymentStatus } = require('@models').system;

const {
  respondBadRequest,
  respondCreated,
  respondOK,
} = require('@utils/response');

const {
  getAllEntities,
  createCatch,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const _ = require('lodash');

/**
 *
 * delete employment status by id
 *
 * id String id of employment table
 * returns Object
 **/
exports.deleteEmploymentstatusesId = async function (id) {
  const employmentStatus = await EmploymentStatus.findByPk(id);
  if (_.isNull(employmentStatus)) {
    return respondBadRequest(`employmentStatus with id ${id} not found`);
  }

  await EmploymentStatus.destroy({
    where: {
      id,
    },
    force: true,
  });

  return respondOK(`${EmploymentStatus.name} with id ${id} succesfuly deleted`);
};

/**
 * Your GET endpoint
 * get all employment status records
 *
 * returns Object
 **/
exports.getEmploymentstatuses = async function (query) {
  return await getAllEntities(query, EmploymentStatus);
};

/**
 * Your GET endpoint
 * we use this id in basic information table
 *
 * id String id of employment table
 * returns Object
 **/
exports.getEmploymentstatusesId = async function (id) {
  return await findAndGet(id, EmploymentStatus);
};

/**
 *
 * add a employment status record
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postEmploymentstatuses = async function (body) {
  return createCatch(body, EmploymentStatus);
};

/**
 *
 * update employment status by id
 *
 * id String id of employment table
 * body Body change name of an employment status (optional)
 * returns Object
 **/
exports.putEmploymentstatusesId = async function (id, body) {
  return await findAndUpdate(id, body, EmploymentStatus);
};
