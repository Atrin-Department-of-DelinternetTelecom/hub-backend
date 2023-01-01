'use strict';

const { Signature, File, User } = require('@models').system;
const path = require('path');
const config = require('@config');
const { respondBadRequest, isResponsePayload } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { saveSingleFile } = require('@utils/file-utils');

const { downloadFile } = require('@utils/file-utils');

/**
 *
 * delete a signature (picture must delete with record)
 *
 * id String id of table signature
 * returns Object
 **/
exports.deleteSignaturesId = async function (id) {
  return await findAndDelete(id, Signature);
};

/**
 * Your GET endpoint
 * get a signature (information no picture)
 *
 * id String id of table signature
 * returns Object
 **/
exports.getSignaturesId = async function (id) {
  return await findAndGet(id, Signature);
};

/**
 * Your GET endpoint
 * get all signature record(not pics)
 *
 * returns Object
 **/
exports.getSinatures = async function (query) {
  return await getAllEntities(query, Signature);
};

/**
 * Your GET endpoint
 * download image of signature
 *
 * id String id of signature to download image of signature
 * no response value expected for this operation
 **/
exports.getSinaturesGet = async function (id) {
  const signature = await findAndGet(
    id,
    Signature,
    {
      model: File,
      as: 'image',
    },
    false,
    true,
  );
  return isResponsePayload(signature)
    ? signature
    : downloadFile(signature.image);
};

/**
 *
 * here we need to upload image
 *
 * body Body body must change (optional)
 * returns Object
 **/
exports.postSinatures = async function (body, signatureFile) {
  const { FilesAndDirectories: fad } = config;
  const owner = await findAndGet(body.owner_id, User, false, false, true);
  if (isResponsePayload(owner)) {
    return owner;
  }

  const filePath = await saveSingleFile(
    signatureFile,
    fad.Signatures,
    owner.id,
  );

  const newFile = await File.create({
    file: filePath,
    fileable_type: fad.Signatures,
    fileable_id: 1,
  });

  body.image_id = newFile.id;

  const signature = await Signature.create(body);

  await File.update(
    {
      fileable_id: signature.id,
    },
    {
      where: {
        id: newFile.id,
      },
    },
  );

  return respondCreated(signature);
};

/**
 *
 * update a signature (information no picture)
 *
 * id String id of table signature
 * body Body  (optional)
 * returns Object
 **/
exports.putSignaturesId = async function (id, body) {
  return await findAndUpdate(id, body, Signature);
};
