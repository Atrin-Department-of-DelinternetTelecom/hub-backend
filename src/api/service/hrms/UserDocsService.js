'use strict';

const { UserDocs, File, User } = require('@models').system;

const FormData = require('form-data');

const { default: axios } = require('axios');

const path = require('path');

const config = require('@config');

const {
  respondBadRequest,
  isResponsePayload,
  respondSuccess,
  respondNotFound,
  respondInternalServerError,
} = require('@utils/response');

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  respondCreated,
} = require('@utils/request-handler');

const { saveSingleFile, downloadFile } = require('@utils/file-utils');

const { isNotNU } = require('@utils/tools');

const fs = require('fs');
const fse = require('fs-extra');

const {
  getEventEmitter,
  GLOBAL_SAVE_IMAGE_OF_PDF,
} = require('../../../lib/emitter');

const _ = require('lodash');

/**
 *
 * delete an user Docs record by id
 *
 * id String id of selected user docs
 * returns Object
 **/
exports.deleteUserDocsId = async function (id) {
  return await findAndDelete(id, UserDocs);
};

/**
 * Your GET endpoint
 * if we call this without id, we get all user docs
 * and if we call this with id we get single user docs related to id
 *
 * returns Object
 **/
exports.getUserDocs = async function (query) {
  return await getAllEntities(query, UserDocs);
};

/**
 * Your GET endpoint
 * get single user docs by id
 *
 * id String id of selected user docs
 * returns Object
 **/
exports.getUserDocsId = async function (id) {
  return await findAndGet(id, UserDocs);
};

/**
 * Your GET endpoint
 * get single user docs by id
 *
 * id String id of selected user docs
 * returns Object
 **/
exports.getUserDocsFileId = async function (id) {
  const userDocs = await UserDocs.findByPk(id);
  const file = await File.findByPk(userDocs.file_id);

  const file_path = path.resolve(config.get('index.root'), file.file);
  if (!fs.existsSync(file_path))
    return respondInternalServerError('File not Exist');
  return file_path;
};

const fileExist = async function (file_id) {
  const file = await File.findByPk(file_id);
  if (_.isNull(file.file)) {
    return false;
  }
  if (fs.existsSync(path.resolve(config.get('index.root'), file.file))) {
    return true;
  }
  return false;
};

/**
 *
 * save a post value
 *
 * body Body parameter needed to save
 * an user docs record (optional)
 * returns Object
 **/

exports.postUserDocs = async function (body, file) {
  const { FilesAndDirectories: fad } = config;

  //owner not found
  const owner = await findAndGet(body.owner_id, User, false, false, true);
  if (isResponsePayload(owner)) {
    return owner;
  }

  //folder not found
  /* let folder = await findAndGet(body.folder_id,
        Folder, {}, false, true);
    if (isResponsePayload(folder)) {
        return folder;
    } */

  //save file
  const filePath = await saveSingleFile(file, fad.UserDocs, owner.id);

  //insert the file info in database
  const newFile = await File.create({
    file: filePath,
    fileable_type: fad.UserDocs,
    fileable_id: 1,
  });

  //save as a user-docs
  body.file_id = newFile.id;
  const newUserDoc = await UserDocs.create(body);

  return respondCreated(newUserDoc);
};

exports.postUserDocsId = async function (id, body, file) {
  const { FilesAndDirectories: fad } = config;

  const userDoc = await findAndGet(id, UserDocs, false, false, true);

  if (isResponsePayload(userDoc)) {
    return userDoc;
  }

  if (!isNotNU(userDoc.file_id)) return respondBadRequest('file not found');

  const filePath = await saveSingleFile(file, fad.UserDocs, userDoc.owner_id);

  //insert the file info in database
  const newFile = await File.create({
    file: filePath,
    fileable_type: fad.UserDocs,
    fileable_id: userDoc.id,
  });

  //delete old file after update
  userDoc.file_id = newFile.id;
  userDoc.docs_information = JSON.parse(body.docs_information);

  return respondSuccess(await userDoc.save());
};

exports.putUserDocsId = async function (id, body) {
  const { FilesAndDirectories: fad } = config;

  const user_doc = await findAndGet(id, UserDocs, false, false, true);
  if (isResponsePayload(user_doc)) {
    return user_doc;
  }

  if (
    isNotNU(body.docs_information.signature_id) &&
    body.docs_information.signature_id !==
      user_doc.docs_information.signature_id
  ) {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_PDF,
      body.docs_information.signature_id,
      path.join(fad.uploads, fad.UserDocs, user_doc.owner_id.toString()),
      'UserDocs',
      id,
      'image_id',
    );
  }
  return findAndUpdate(id, body, UserDocs);
};

exports.getUserDocsOfUserId = async function (id, query) {
  const user = await findAndGet(id, User, false, false, true);
  if (isResponsePayload(user)) {
    return user;
  }

  return getAllEntities(query, UserDocs, {
    owner_id: id,
  });

  /*  return await findAndGet(id, User, [{
         model: UserDocs,
         as: "docs"
     }], false, false); */
};

exports.postSignUserDocsId = async function (id, file) {
  const fad = config.get('index.FilesAndDirectories');
  const userDoc = await findAndGet(id, UserDocs, false, false, true);
  if (isResponsePayload(userDoc)) {
    return userDoc;
  }
  const pathOfFile = await saveSingleFile(file, fad.UserDocSinature);
  const fileRecord = await File.create({
    file: pathOfFile,
    fileable_id: userDoc.id,
    fileable_type: 'user_doc_signature',
  });
  userDoc.docs_information = {
    status: 'signed',
    signature_id: fileRecord.id,
  };
  updateImageAfterSign(pathOfFile, userDoc);
  return respondSuccess(await userDoc.save());
};

exports.getSignUserDocsFileId = async function (id) {
  const userDoc = await findAndGet(id, UserDocs, false, false, true);
  if (isResponsePayload(userDoc)) {
    return userDoc;
  }
  if (userDoc.docs_information.signature_id == undefined) {
    return respondNotFound('signature for this user not found');
  }
  const file = await File.findByPk(userDoc.docs_information.signature_id);
  if (file === null) {
    respondNotFound('file not found');
  }
  return path.resolve(config.get('index.root'), file.file);
};

exports.getUserDocsImageId = async function (id) {
  const userDoc = await findAndGet(
    id,
    UserDocs,
    {
      model: File,
      as: 'pdf_image',
    },
    false,
    true,
  );
  return isResponsePayload(userDoc) ? userDoc : downloadFile(userDoc.pdf_image);
};

const updateImageAfterSign = async (pathOfFile, userDoc) => {
  const file = await fs.promises.readFile(path.resolve(pathOfFile));
  const { FilesAndDirectories: fad, pdfMaker } = config;
  const form = new FormData();
  form.append('pdf', file);
  form.append('page_number', pdfMaker.pageNumber);
  form.append('density', pdfMaker.density);
  form.append('scale', pdfMaker.scale);

  const fileDir = path.join(
    fad.uploads,
    fad.UserDocs,
    userDoc.owner_id.toString(),
  );

  await fse.ensureDir(fileDir);

  const pathOfImage = path.join(fileDir, `${Date.now()}-pdf-page.png`);
  const writer = fs.createWriteStream(path.resolve(pathOfImage));
  // REFACTOR: do not mix async await and promise ching
  axios
    .post(pdfMaker.url, form, {
      headers: {
        ...form.getHeaders(),
      },
      responseType: 'stream',
    })
    .then(async (response) => {
      response.data.pipe(writer);
      const fileRecord = await File.create({
        fileable_id: userDoc.id,
        fileable_type: 'userDoc sign pdf image',
        file: pathOfImage,
      });
      userDoc.image_id = fileRecord.id;
      userDoc.save();
    })
    .catch((err) => console.log(err));
};
