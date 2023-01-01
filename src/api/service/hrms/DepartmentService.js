'use strict';

const { Department } = require('@models').system;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDelete,
} = require('@utils/request-handler');

const {
  respondBadRequest,
  respondOK,
  respondCreated,
} = require('@utils/response');

const _ = require('lodash');

/**
 *
 * delete a department record by id
 *
 * id String
 * returns Object
 **/
exports.deleteDepartmentsId = async function (id) {
  const department = await Department.findByPk(id);
  if (_.isNull(department)) {
    return respondBadRequest(`department with id ${id} not found`);
  }

  await Department.destroy({
    where: {
      id,
    },
    force: true,
  });

  return respondOK(`${Department.name} with id ${id} succesfuly deleted`);
};

/**
 * Your GET endpoint
 * get all departments(information) record
 *
 * returns Object
 **/
exports.getDepartments = async function (query) {
  return await getAllEntities(query, Department);
};

/**
 * Your GET endpoint
 * get single department record by id
 *
 * id String
 * returns Object
 **/
exports.getDepartmentsId = async function (id) {
  return await findAndGet(id, Department);
};

/**
 *
 * add a department record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postDepartments = async function (body) {
  return createCatch(body, Department);
};

/**
 *
 * update a department record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected department (optional)
 * returns Object
 **/
exports.putDepartmentsId = async function (id, body) {
  return await findAndUpdate(id, body, Department);
};
