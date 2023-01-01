'use strict';

const { File } = require('@models').system;

const _ = require('lodash');

const { respondNotFound } = require('@utils/response');

const { downloadFile } = require('@utils/file-utils');

exports.getDownloadFileId = async function (id) {
  const file = await File.findByPk(id);
  if (_.isNull(file)) {
    return respondNotFound(`file with id ${id} not found`);
  }
  return downloadFile(file);
};
