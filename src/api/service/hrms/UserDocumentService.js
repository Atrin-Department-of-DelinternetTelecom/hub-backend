// @ts-check
'use strict';

const {
  system: { UserDocument },
} = require('@models');
const {
  findAndDelete,
  findAndUpdate,
  findAllEntities,
} = require('@utils/request-handler');
const {
  respondCreated,
  respondSuccessWithPagination,
  respondNotFound,
  respondBadRequest,
} = require('@utils/response');
const fileUtils = require('@utils/file-utils');

exports.getUserDocuments = async function (query, url) {
  const { size, page } = query;

  const { rows: _rows, count } = await findAllEntities(query, UserDocument);

  const rows = _rows.map((item) => {
    const { file, ...rest } = item.toJSON();
    if (file) {
      const itemUrl = new URL(url);
      itemUrl.pathname = file;
      return {
        ...rest,
        file: itemUrl.toString(),
      };
    } else {
      return {
        ...rest,
        file,
      };
    }
  });
  return respondSuccessWithPagination(rows, count, size, page, query.url);
};

exports.getUserDocumentById = async function (id, url) {
  const userDocument = await UserDocument.findByPk(id);
  if (!userDocument)
    return respondNotFound(`leave request with id:${id} not found.`);

  const itemUrl = new URL(url);
  itemUrl.pathname = userDocument.file;
  userDocument.file = itemUrl.toString();
  return respondCreated(userDocument);
};

exports.postUserDocument = async function (body, file, creator_id) {
  const { FilesAndDirectories: fad } = require('@config');

  file = await fileUtils.saveSingleFile(file, fad.userDocumentFile, creator_id);

  const material = await UserDocument.create({ ...body, file, creator_id });

  return respondCreated(material);
};

exports.deleteMaterial = function (id) {
  return findAndDelete(id, UserDocument);
};

exports.deleteUserDocument = function (id) {
  return findAndDelete(id, UserDocument);
};

exports.updateUserDocument = async function (id, body, file, userId) {
  const { FilesAndDirectories: fad } = require('@config');
  if (file)
    body.file = await fileUtils.saveSingleFile(
      file,
      fad.userDocumentFile,
      userId,
    );

  if (!body) return respondBadRequest('nothing to update');
  return findAndUpdate(id, body, UserDocument);
};
