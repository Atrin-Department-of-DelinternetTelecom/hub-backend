'use strict';

const { EmployeeBasicInformation, User, Job, Department, EmploymentStatus } =
  require('@models').system;
const {
  respondNotFound,
  respondBadRequest,
  respondSuccess,
  respondCreated,
} = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteBasicinformationsId = async function (id) {
  return await findAndDelete(id, EmployeeBasicInformation);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getBasicinformations = async function (query) {
  return await getAllEntities(query, EmployeeBasicInformation);
};

/**
 * Your GET endpoint
 * get single basic information record by id
 *
 * id String
 * returns Object
 **/
exports.getBasicinformationsId = async function (id) {
  const basicInformation = await EmployeeBasicInformation.findOne({
    where: {
      employee_id: id,
    },
    include: [
      {
        model: Job,
        as: 'job',
      },
      {
        model: Department,
        as: 'department',
      },
      {
        model: EmploymentStatus,
        as: 'employment_status',
      },
    ],
  });
  if (basicInformation !== null) {
    basicInformation.meta = {};
    return respondSuccess(basicInformation);
  }
  return respondNotFound(`basic information with id:${id} not found`);
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postBasicinformationsId = async function (body) {
  if (
    typeof body.employee_id == 'undefined' ||
    (await User.findByPk(body.employee_id)) === null
  ) {
    return respondBadRequest('user not found');
  }

  if (
    typeof body.department_id == 'undefined' &&
    (await Department.findByPk(body.department_id)) === null
  ) {
    return respondBadRequest('department not found');
  }

  if (
    typeof body.employment_status_id == 'undefined' &&
    (await EmploymentStatus.findByPk(body.employment_status_id)) === null
  ) {
    return respondBadRequest('employment status not found');
  }

  if (
    typeof body.job_id == 'undefined' &&
    (await Job.findByPk(body.job_id)) === null
  ) {
    return respondBadRequest('job not found');
  }
  return respondCreated(await EmployeeBasicInformation.create(body));
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
exports.putBasicinformationsId = async function (id, body) {
  return await findAndUpdate(id, body, EmployeeBasicInformation);
};
