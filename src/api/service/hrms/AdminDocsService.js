'use strict';
const { AdminDocs, UserDocs, File, Folder, User, Notification } =
  require('@models').system;

const socket = require('@lib/socket');

const path = require('path');

const _ = require('lodash');

const config = require('@config');

const fs = require('fs');
const fse = require('fs-extra');

const status = require('http-status');

const {
  respondBadRequest,
  respondCreated,
  isResponsePayload,
  respondSuccess,
  respondNotFound,
  respondOK,
} = require('@utils/response');

const {
  getAllEntities,
  findAndUpdate,
  findAndDelete,
  findAndGet,
} = require('@utils/request-handler');

const {
  saveSingleFile,
  downloadFile,
  getFileExtension,
} = require('@utils/file-utils');

const { v4: uuidv4 } = require('uuid');

const { commands } = require('@constants/ws');

const {
  getEventEmitter,
  GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION,
  GLOBAL_SAVE_IMAGE_OF_HANDLEBARS,
  GLOBAL_SAVE_IMAGE_OF_PDF,
  GLOBAL_SAVE_IMAGE_OF_HTML,
} = require('../../../lib/emitter');

/**
 *
 * delete an admin Docs record by id
 *
 * id String id of selected admin docs
 * returns Object
 **/
exports.deleteAdminDocsId = async function (id) {
  const adminDoc = await AdminDocs.findByPk(id);
  const result = await findAndDelete(id, AdminDocs);
  if (result.code === status.OK) {
    const count = await AdminDocs.count({
      where: {
        folder_id: adminDoc.folder_id,
      },
    });
    await Folder.update(
      {
        total_docs: count,
      },
      {
        where: {
          id: adminDoc.folder_id,
        },
      },
    );
  }
  return result;
};

exports.postSendDoc = async function (body) {
  const { SendDoc } = config.Notifications;
  const owner = await findAndGet(body.owner_id, User, false, false, true);
  if (isResponsePayload(owner)) {
    return owner;
  }

  const adminDoc = await findAndGet(
    body.admin_doc_id,
    AdminDocs,
    false,
    false,
    true,
  );
  if (isResponsePayload(adminDoc)) {
    return adminDoc;
  }

  const userDoc = await UserDocs.findOne({
    where: {
      owner_id: body.owner_id,
      admin_doc_id: body.admin_doc_id,
    },
  });

  if (userDoc) {
    return respondBadRequest('this document has been sent');
  }

  const find = await fileExist(adminDoc.file_id);
  if (!find) {
    return respondBadRequest('file not exist');
  }

  const newfile = await copyFile(adminDoc.file_id, body.owner_id);
  // body.docs_information = {
  //     sign: false
  // };
  // if (body.require_sign) {
  //     body.docs_information = adminDoc.user_docs;
  // }
  // delete body.require_sign
  const newUserDoc = await UserDocs.create({
    name: adminDoc.name,
    folder_id: adminDoc.folder_id,
    owner_id: body.owner_id,
    creator_id: body.creator_id,
    file_id: newfile.id,
    image_id: adminDoc.image_id,
    admin_doc_id: adminDoc.id,
    docs_information: body.require_sign
      ? { status: 'pending', format: adminDoc.user_docs.format }
      : {
          status: 'notNeed',
          format: adminDoc.user_docs.format,
        },
  });

  getEventEmitter().emit(
    GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION,
    {
      ...body,
      ...SendDoc,
      app: 'hrms',
    },
    {
      user_doc_id: newUserDoc.id,
    },
  );

  newfile.fileable_id = newUserDoc.id;
  await newfile.save();
  return respondSuccess(newUserDoc);
};

getEventEmitter().on(
  GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION,
  (notification_info, metadata) => {
    sendNotification(notification_info, metadata);
  },
);

const sendNotification = async function (notification_info, metadata) {
  // create new notification
  const notification = await Notification.create({
    concept: notification_info.concept,
    subject: notification_info.subject,
    text: notification_info.text,
    app: notification_info.app,
    read: notification_info.read ? true : false,
    owner_id: notification_info.owner_id,
    creator_id: notification_info.creator_id,
    metadata,
  });

  //send created notification by websocet

  socket.emitIn(
    notification_info.owner_id,
    `${commands.new_notification}/system`,
    notification.get({ plain: true }),
  );

  return respondOK('new notification sent.');
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

const copyFile = async function (file_id, owner_id) {
  const { FilesAndDirectories: fad } = config;
  const { uploads, UserDocs } = fad;

  const file = await File.findByPk(file_id);

  const filename = file.file.replace(/^.*[\\/]/, '');
  const fileDir = path.join(uploads, UserDocs, owner_id.toString());
  const file_path = path.join(fileDir, filename);

  await fse.ensureDir(fileDir);

  await fs.promises.copyFile(
    path.resolve(config.get('index.root'), file.file),
    path.resolve(config.get('index.root'), file_path),
  );

  return File.create({
    file: file_path,
    fileable_type: UserDocs,
    fileable_id: 1,
  });
};

/**
 * Your GET endpoint
 * if we call this without id, we get all admin docs
 * and if we call this with id we get single admin docs related to id
 *
 * returns Object
 **/
exports.getAdminDocs = async function (query) {
  return await getAllEntities(query, AdminDocs);
};

/**
 * Your GET endpoint
 * get single admin docs by id
 *
 * id String id of selected admin docs
 * returns Object
 **/
exports.getAdminDocsId = async function (id) {
  const adminDoc = await AdminDocs.findByPk(id, {
    include: {
      all: true,
    },
  });
  if (adminDoc === null) {
    return respondNotFound('doc not found');
  }
  return respondSuccess(adminDoc, {
    posted_to: await UserDocs.count({
      where: {
        admin_doc_id: adminDoc.id,
      },
    }),
  });
};

/**
 * Your GET endpoint
 * get single admin docs by id
 *
 * id String id of selected admin docs
 * returns Object
 **/
exports.getAdminDocsFileId = async function (id) {
  const adminDocs = await findAndGet(
    id,
    AdminDocs,
    {
      model: File,
      as: 'file',
    },
    false,
    true,
  );
  return isResponsePayload(adminDocs)
    ? adminDocs
    : downloadFile(adminDocs.file);
};

/**
 *
 * save a post value
 *
 * body Body parameter needed to save
 * an admin docs record (optional)
 * returns Object
 **/

exports.postAdminDocsId = async function (body, file) {
  const { FilesAndDirectories: fad } = config;

  const folder = await findAndGet(body.folder_id, Folder, false, false, true);

  if (isResponsePayload(folder)) {
    return folder;
  }

  const pathFile = await saveSingleFile(file, fad.AdminDocs, body.creator_id);

  const newFile = await File.create({
    file: pathFile,
    fileable_type: fad.AdminDocs,
    fileable_id: 1,
  });

  body.file_id = newFile.id;
  body.user_docs = {
    status: body.needSign,
    format: getFileExtension({ name: newFile.file })[0],
  };
  delete body.needSign;
  const newAdminDoc = await AdminDocs.create(body);

  // check that if admin_doc file is pdf or handlebars of html
  attachImage(
    newFile,
    'AdminDocPdfImage',
    'AdminDocs',
    newAdminDoc.id,
    'image_id',
  );
  const count = await AdminDocs.count({
    where: {
      folder_id: newAdminDoc.folder_id,
    },
  });

  //update folder files counter
  await Folder.update(
    {
      total_docs: count,
    },
    {
      where: {
        id: newAdminDoc.folder_id,
      },
    },
  );

  //update update file refrence
  await File.update(
    {
      fileable_id: newAdminDoc.id,
    },
    {
      where: {
        id: newAdminDoc.file_id,
      },
    },
  );

  return respondCreated(newAdminDoc);
};

const attachImage = async (
  file_model,
  directory,
  model_name,
  model_id,
  column_name,
) => {
  const extFile = getFileExtension({ name: file_model.file });
  if (extFile[0] === 'pdf') {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_PDF,
      file_model.id,
      directory,
      model_name,
      model_id,
      column_name,
    );
  } else if (extFile[0] === 'handlebars') {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_HANDLEBARS,
      file_model.id,
      directory,
      model_name,
      model_id,
      column_name,
    );
  } else if (extFile[0] === 'html') {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_HTML,
      file_model.id,
      directory,
      model_name,
      model_id,
      column_name,
    );
  }
};

/**
 *
 * update an admin docs record by id
 *
 * id String id of selected admin docs
 * body Body in this example we want
 * to update name and username (optional)
 * returns Object
 **/
exports.putAdminDocsId = async function (id, body) {
  if (
    typeof body.folder_id == 'undefined' ||
    (await Folder.findByPk(body.folder_id)) === null
  ) {
    return respondBadRequest(`folder with id:${body.folder_id} not found.`);
  }
  const oldAdminDocs = await AdminDocs.findByPk(id);
  const result = await findAndUpdate(id, body, AdminDocs);
  if (result.code === status.OK) {
    // this is for updated value
    const count = await AdminDocs.count({
      where: {
        folder_id: result.payload.data.folder_id,
      },
    });
    await Folder.update(
      {
        total_docs: count,
      },
      {
        where: {
          id: result.payload.data.folder_id,
        },
      },
    );

    // this is for old value
    const oldCount = await AdminDocs.count({
      where: {
        folder_id: oldAdminDocs.folder_id,
      },
    });
    await Folder.update(
      {
        total_docs: oldCount,
      },
      {
        where: {
          id: oldAdminDocs.folder_id,
        },
      },
    );
  }
  return result;
};

exports.getAdminDocsImageId = async function (id) {
  const adminDoc = await findAndGet(
    id,
    AdminDocs,
    {
      model: File,
      as: 'pdf_image',
    },
    false,
    true,
  );
  return isResponsePayload(adminDoc)
    ? adminDoc
    : adminDoc.pdf_image !== null
    ? path.resolve(config.get('index.root'), adminDoc.pdf_image.file)
    : respondBadRequest('file not exist');
};
