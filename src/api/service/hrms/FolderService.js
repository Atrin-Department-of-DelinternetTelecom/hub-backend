'use strict';

const { Folder } = require('@models').system;
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete folder by id
 *
 * id String id of folder table
 * returns Object
 **/
exports.deleteFoldersId = async function (id) {
  return await findAndDelete(id, Folder);
};

/**
 * Your GET endpoint
 * get all folder records
 *
 * returns Object
 **/
exports.getFolders = async function (query) {
  return await getAllEntities(query, Folder);
};

/**
 * Your GET endpoint
 *
 *
 * get folder record by id
 * returns Object
 **/
exports.getFoldersId = async function (id) {
  return await findAndGet(id, Folder);
};

/**
 *
 * add a add folder record
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postFolders = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, Folder);
};

/**
 *
 * update folder by id
 *
 * id String id of folder table
 * body Body change name of an folder (optional)
 * returns Object
 **/
exports.putFoldersId = async function (id, body) {
  return await findAndUpdate(id, body, Folder);
};
