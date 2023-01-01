'use strict';

const { Job } = require('@models').system;
const {
  respondCreated,
  respondBadRequest,
  respondOK,
} = require('@utils/response');

const {
  findAndUpdate,
  findAndGet,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const _ = require('lodash');

/**
 *
 * delete a job record by id
 *
 * id String id of table job
 * returns Object
 **/
exports.deleteJobsId = async function (id) {
  const job = await Job.findByPk(id);
  if (!job) {
    return respondBadRequest(`job with id ${id} not found`);
  }

  await Job.destroy({
    where: {
      id,
    },
    force: true,
  });

  return respondOK(`${Job.name} with id ${id} succesfuly deleted`);
};

/**
 * Your GET endpoint
 * get all jobs
 *
 * returns Object
 **/
exports.getJobs = async function (query) {
  return await getAllEntities(query, Job);
};

/**
 * Your GET endpoint
 * get a job record by id
 *
 * id String id of table job
 * returns Object
 **/
exports.getJobsId = async function (id) {
  return await findAndGet(id, Job);
};

/**
 *
 * add a job
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postJobs = async function (body) {
  return createCatch(body, Job);
};

/**
 *
 * update a job record by id
 *
 * id String id of table job
 * body Body change name of seletcte job (optional)
 * returns Object
 **/
exports.putJobsId = async function (id, body) {
  return await findAndUpdate(id, body, Job);
};
