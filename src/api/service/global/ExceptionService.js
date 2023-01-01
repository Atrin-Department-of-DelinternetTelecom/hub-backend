'use strict';

const { Exception } = require('@models').system;
const _ = require('lodash');

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
} = require('@utils/request-handler');

const {
  respondCreated,
  respondSuccess,
  respondNotFound,
} = require('@utils/response');

exports.getAllExceptions = async (query) => {
  return await getAllEntities(query, Exception);
};

exports.getExceptionId = async (id) => {
  return await findAndGet(id, Exception);
};

exports.deleteExceptionId = async (id) => {
  return await findAndDelete(id, Exception);
};
