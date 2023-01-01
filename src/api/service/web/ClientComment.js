// @ts-check
'use strict';

const {
  system: { ClientComment },
} = require('@models');

const {
  findAndUpdate,
  findAndDelete,
  findAllEntities,
  createCatch,
} = require('@utils/request-handler');

const {
  respondNotFound,
  respondSuccessWithPagination,
} = require('@utils/response');
const { uploadFile, deleteFile } = require('../file/fileService');
const { default: to } = require('await-to-js');

/**
 *
 * delete a Client Comment record by id
 *
 * @param {string} id
 * returns Object
 **/
exports.deleteClientCommentsId = async function (id) {
  return findAndDelete(id, ClientComment);
};

/**
 * Your GET endpoint
 * get all Client Comments(information) record
 * @param {any} query
 * @param {URL} url
 **/
exports.getClientComments = async function (query, url) {
  const { size, page } = query;
  const { rows: _rows, count } = await findAllEntities(query, ClientComment);

  const rows = _rows.map((item) => {
    const itemUrl = new URL(url);
    itemUrl.pathname = item.avatarUrl;

    return {
      ...item.toJSON(),
      avatar: item.avatarUrl ? itemUrl.toString() : null,
    };
  });

  return respondSuccessWithPagination(rows, count, size, page, query.url);
};

/**
 * Your GET endpoint
 * get single Client Comment record by id
 *
 * * @param {string} id
 * * @param {URL} url
 * returns Object
 **/
exports.getClientCommentsId = async function (id, url) {
  const clientComment = await ClientComment.findByPk(id);
  if (!clientComment) respondNotFound('client comment was not found!');
  return {
    ...clientComment.get({ plain: true }),
    avatar: clientComment.avatarUrl,
  };
};

/**
 *
 * add a Client Comment record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postClientComments = async function (body, file) {
  const { filename: avatar } = await uploadFile(
    ClientComment.avatarBucket,
    file,
  );
  return createCatch({ ...body, avatar }, ClientComment);
};

/**
 *
 * update a Client Comment record by id
 *
 * @param {string} id
 * body Body in this example we want to change
 * name of the selected Client Comment (optional)
 * returns Object
 **/
exports.putClientCommentsId = async function (id, body, file) {
  let avatar = null;

  if (file) {
    const { filename } = await uploadFile(ClientComment.avatarBucket, file);
    avatar = filename;
  } else {
    await to(deleteFile(ClientComment.avatar, ClientComment.avatarBucket));
  }

  return findAndUpdate(id, { ...body, avatar }, ClientComment);
};
