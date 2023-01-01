'use strict';

const config = require('@config');
const { saveSingleFile } = require('@utils/file-utils');
const {
  respondSuccess,
  respondBadRequest,
  respondNotFound,
} = require('@utils/response');
const path = require('path');
const fs = require('fs');

/**
 * Your GET endpoint
 * get all Form(information) record
 *
 * returns Object
 **/
exports.downloadLogo = async function (isIcon) {
  try {
    const directoryPath = path.resolve(
      config.get('index.FilesAndDirectories.uploads'),
      config.get('index.FilesAndDirectories.Logo'),
    );
    const images = await fs.promises.readdir(directoryPath);
    const selectedImage = images.find((image) =>
      image.includes(isIcon === 'true' ? 'icon' : 'logo'),
    );
    if (!selectedImage) return respondNotFound(`image not found`);
    return path.join(directoryPath, selectedImage);
  } catch (error) {
    return respondBadRequest('file not available');
  }
};

/**
 * Your GET endpoint
 * get all Form(information) record
 *
 * returns Object
 **/
exports.uploadLogo = async function (image, isIcon) {
  const ext = image.name.substring(image.name.lastIndexOf('.') + 1);
  if (!['jpg', 'jpeg', 'png', 'svg'].includes(ext.toLowerCase())) {
    return respondBadRequest(`ext is not valid`);
  }

  await saveSingleFile(
    image,
    config.get('index.FilesAndDirectories.Logo'),
    undefined,
    isIcon === 'true' ? 'icon' : 'logo',
  );

  return respondSuccess(`image uploaded successfully.`);
};
