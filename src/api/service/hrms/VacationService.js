'use strict';

const { Vacation, Signature, File, User } = require('@models').system;

const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const config = require('@config');
const { Op } = require('sequelize');
const {
  respondBadRequest,
  respondNotFound,
  respondSuccess,
  respondConflict,
  respondCreated,
  isResponsePayload,
} = require('@utils/response');

const {
  getAllEntities,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const fileUtils = require('@utils/file-utils');

const { isNotNU } = require('@utils/tools');

const axios = require('axios').default;

const FormData = require('form-data');

const {
  getEventEmitter,
  GLOBAL_SAVE_IMAGE_OF_PDF,
} = require('../../../lib/emitter');

/**
 *
 * delete a vacation record
 *
 * id String id of vacation table
 * returns Object
 **/
exports.deleteVacationsId = async function (id) {
  return await findAndDelete(id, Vacation);
};

/**
 * Your GET endpoint
 * get all vacation records
 *
 * returns Object
 **/
exports.getVacations = async function (query) {
  return await getAllEntities(query, Vacation);
};

exports.getVacationsId = async function (id) {
  return await findAndGet(id, Vacation);
};

exports.getVacationsbetweenDates = async function (start_date, end_date) {
  let vacations = {};
  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    vacations = await Vacation.findAll({
      where: {
        [Op.or]: [
          {
            from: {
              [Op.gte]: start,
              [Op.lte]: end,
            },
          },
          {
            to: {
              [Op.gte]: start,
              [Op.lte]: end,
            },
          },
          {
            [Op.and]: [
              {
                from: {
                  [Op.lt]: start,
                },
              },
              {
                to: {
                  [Op.gt]: end,
                },
              },
            ],
          },
        ],
      },
      include: {
        all: true,
      },
    });
  } else if (start_date) {
    const start = new Date(start_date);
    vacations = await Vacation.findAll({
      where: {
        from: {
          [Op.gte]: start,
        },
      },
      include: {
        all: true,
      },
    });
  } else if (end_date) {
    const end = new Date(end_date);
    vacations = await Vacation.findAll({
      where: {
        from: {
          [Op.gte]: end,
        },
      },
      include: {
        all: true,
      },
    });
  }
  return respondSuccess(vacations);
};

/**
 *
 * add a vacation (of a user) to system
 *
 * body Body for first time not need to sign picture (optional)
 * returns Object
 **/
exports.postVacations = async function (body, creator_id) {
  if (
    typeof body.owner_id == 'undefined' ||
    (await User.findByPk(body.owner_id)) === null
  ) {
    return respondNotFound('user not found');
  }
  if (await checkConflict(body.from, body.to, body.owner_id)) {
    return respondConflict('conflict between dates of vacation');
  }
  body.creator_id = creator_id;
  return respondCreated(await Vacation.create(body));
};

/**
 *
 * update a vacation record
 *
 * id String id of vacation table
 * body Body we can update (sign the vacation) by id of signature or upload an image. id must be string (optional)
 * no response value expected for this operation
 **/
exports.putVacationsId = async function (id, body) {
  const vacation = await findAndGet(id, Vacation, false, false, true);
  const updatebleState = ['start', 'finish', 'cancel'];
  if (isResponsePayload(vacation)) {
    return vacation;
  }
  if (vacation.state === 'pending') {
    return await findAndUpdate(id, body, Vacation);
  } else if (
    vacation.state === 'approve' &&
    body.state !== undefined &&
    body.state !== null &&
    updatebleState.includes(body.state)
  ) {
    return await findAndUpdate(
      id,
      {
        state: body.state,
      },
      Vacation,
    );
  }
  return respondBadRequest('vacation not updateble');
};

// image should be id that refer to image or an image file
exports.getFileRecordId = async function (image, vacation) {
  const { FilesAndDirectories: fad } = config;
  if (typeof image == 'number') {
    const signature = await Signature.findOne({
      where: {
        id: image,
      },
    });
    return signature.image_id;
  } else {
    if (image) {
      // check that this file is image or no
      const pathOfTheFile = await fileUtils.saveSingleFile(
        image,
        fad.VacationSignature,
        vacation.id,
      );
      const newfile = await File.create({
        file: pathOfTheFile,
        fileable_type: 'vacation',
        is_valid: true,
        fileable_id: vacation.id,
      });
      return newfile.id;
    }
  }
  return null;
};

const checkConflict = async function (start_date, end_date, owner_id) {
  // get values from start date and end date
  // if we have any values then we have conflict
  const start = new Date(start_date);
  const end = new Date(end_date);
  const vacations = await Vacation.findAll({
    where: {
      owner_id,
      state: {
        [Op.notIn]: ['cancel', 'finish'],
      },
      [Op.or]: [
        {
          from: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        },
        {
          to: {
            [Op.gte]: start,
            [Op.lte]: end,
          },
        },
        {
          [Op.and]: [
            {
              from: {
                [Op.lt]: start,
              },
            },
            {
              to: {
                [Op.gt]: end,
              },
            },
          ],
        },
      ],
    },
  });
  return vacations.length > 0 ? true : false;
};

exports.updateVacationId = async function (id, body) {
  const vacation = await findAndGet(id, Vacation, false, false, true);
  const updatebleState = ['start', 'finish', 'cancel'];
  if (isResponsePayload(vacation)) {
    return vacation;
  }
  if (vacation.state === 'pending') {
    if (
      isNotNU(body.signature_id) &&
      body.signature_id != vacation.signature_id
    ) {
      const signature = await Signature.findOne({
        where: {
          id: body.signature_id,
        },
      });
      if (signature === null) {
        return respondNotFound('signature not fund');
      }
      body.signature_id = signature.image_id;
    }
    if (
      isNotNU(body.sign_doc_file_id) &&
      body.sign_doc_file_id !== vacation.sign_doc_file_id
    ) {
      getEventEmitter().emit(
        GLOBAL_SAVE_IMAGE_OF_PDF,
        body.sign_doc_file_id,
        'SignDocImage',
        'Vacation',
        id,
        'sign_doc_image_id',
      );
    }
    return await findAndUpdate(id, body, Vacation);
  } else if (
    vacation.state === 'approve' &&
    body.state != undefined &&
    updatebleState.includes(body.state)
  ) {
    return await findAndUpdate(
      id,
      {
        state: body.state,
      },
      Vacation,
    );
  }
  return respondBadRequest('vacation not updateble');
};

exports.getVacationsOfUserId = async function (id) {
  if ((await User.findByPk(id)) === null) {
    return respondNotFound('user not found');
  }
  return await User.findOne({
    where: {
      id,
    },
    include: [
      {
        model: Vacation,
        as: 'vacations',
      },
    ],
  });
};

exports.getVacationsSignatureId = async function (id) {
  const vacation = await findAndGet(
    id,
    Vacation,
    {
      model: File,
      as: 'signature',
    },
    false,
    true,
  );

  return isResponsePayload(vacation)
    ? vacation
    : fileUtils.downloadFile(vacation.signature);
};

exports.postVacationsHtmlFileId = async function (id, body) {
  const { uploads, VacationHtml } = config.get('index.FilesAndDirectories');

  //get vacation
  const vacation = await Vacation.findByPk(id);
  if (!vacation) {
    return respondBadRequest('vacation not found');
  }

  const dir = path.resolve(uploads, VacationHtml);
  await fse.ensureDir(dir);

  const file_path = path.join(
    uploads,
    VacationHtml,
    `${VacationHtml}-${Date.now()}.html`,
  );
  await fs.promises.writeFile(path.resolve(file_path), body.html);

  // create new file record
  const file = await File.create({
    fileable_id: vacation.id,
    file: file_path,
    fileable_type: 'vacation html',
  });

  //attach new file to vacation
  vacation.html_file_id = file.id;
  await vacation.save();

  return respondSuccess('html file added');
};

exports.getVacationsHtmlFileId = async function (id) {
  const vacation = await findAndGet(
    id,
    Vacation,
    {
      model: File,
      as: 'html_file',
    },
    false,
    true,
  );
  return isResponsePayload(vacation)
    ? vacation
    : fileUtils.downloadFile(vacation.html_file);
};

exports.getSignedDocFileId = async function (id) {
  const vacation = await findAndGet(
    id,
    Vacation,
    {
      model: File,
      as: 'sign_doc',
    },
    false,
    true,
  );

  return isResponsePayload(vacation)
    ? vacation
    : fileUtils.downloadFile(vacation.sign_doc);
};

exports.postSignedDocFileId = async function (id, doc_file) {
  const { VacationSignDoc } = config.get('index.FilesAndDirectories');

  //get vacation
  const vacation = await Vacation.findByPk(id);
  if (!vacation) {
    return respondBadRequest('vacation not found');
  }

  // write file
  const file_path = await fileUtils.saveSingleFile(doc_file, VacationSignDoc);
  // create new file record
  const file = await File.create({
    fileable_id: vacation.id,
    file: file_path,
    fileable_type: 'vacation sign doc',
  });

  attachImageOfPdf(file_path, vacation);

  //attach new file to vacation
  vacation.sign_doc_file_id = file.id;
  await vacation.save();

  return respondSuccess('doc file added');
};

exports.getSignedDocImageId = async function (id) {
  const vacation = await findAndGet(
    id,
    Vacation,
    {
      model: File,
      as: 'sign_doc_image',
    },
    false,
    true,
  );

  return isResponsePayload(vacation)
    ? vacation
    : fileUtils.downloadFile(vacation.sign_doc_image);
};

const attachImageOfPdf = async (pathOfFile, vacation) => {
  const file = await fs.promises.readFile(path.resolve(pathOfFile));
  const { FilesAndDirectories: fad, pdfMaker } = config;
  const form = new FormData();
  form.append('pdf', file);
  form.append('page_number', pdfMaker.pageNumber);
  form.append('density', pdfMaker.density);
  form.append('scale', pdfMaker.scale);

  const pdfImagesDir = path.join(fad.uploads, fad.SignDocImage);
  await fse.ensureDir(pdfImagesDir);

  const pathOfPdf = path.join(
    fad.uploads,
    fad.SignDocImage,
    `${vacation.id}-pdf-page.png`,
  );
  const writer = fs.createWriteStream(path.resolve(pathOfPdf));

  const response = await axios.post(pdfMaker.url, form, {
    headers: {
      ...form.getHeaders(),
    },
    responseType: 'stream',
  });

  response.data.pipe(writer);
  const fileRecord = await File.create({
    fileable_id: vacation.id,
    fileable_type: 'vacation sign doc pdf image',
    file: pathOfPdf,
  });
  vacation.sign_doc_image_id = fileRecord.id;

  return vacation.save();
};
