'use strict';

const { TimeSheet } = require('@models').system;
const { respondBadRequest } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete a single time sheet by {id}
 *
 * id String id of table time_sheet
 * returns Object
 **/
exports.deleteTimeSheetId = async function (id) {
  return await findAndDelete(id, TimeSheet);
};

/**
 * Your GET endpoint
 * get a single time sheet by {id}
 *
 * id String id of table time_sheet
 * returns Object
 **/
exports.getTimeSheetId = async function (id) {
  return await findAndGet(id, TimeSheet);
};

/**
 * Your GET endpoint
 * get all timesheet information
 *
 * returns Object
 **/
exports.getTimeSheets = async function (query) {
  return await getAllEntities(query, TimeSheet);
};

/**
 * Your GET endpoint
 * download time sheet
 *
 * id String id of the time sheet
 * no response value expected for this operation
 **/

//TODO: set for download

exports.getTimeSheetsGetsheet = async function (id) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
};

/**
 *
 * add a timesheet information
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postTimeSheets = async function (body, creator_id) {
  body.creator_id = creator_id;
  return respondCreated(await TimeSheet.create(body));
};

/**
 *
 * update a single time sheet by {id}
 *
 * id String id of table time_sheet
 * body Body for example we can change end date (optional)
 * returns Object
 **/
exports.putTimeSheetId = async function (id, body) {
  return await findAndUpdate(id, body, TimeSheet);
};
