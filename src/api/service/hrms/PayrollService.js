'use strict';

const path = require('path');

const config = require('@config');

const fileUtils = require('@utils/file-utils');

const {
  respondBadRequest,
  respondSuccess,
  isResponsePayload,
  respondNotFound,
  respondCreated,
} = require('@utils/response');

const {
  getAllEntities,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const fs = require('fs');

const {
  getEventEmitter,
  GLOBAL_SAVE_IMAGE_OF_PDF,
} = require('../../../lib/emitter');

const { Payroll, File, Signature, User } = require('@models').system;

const axios = require('axios').default;

const FormData = require('form-data');

const { downloadFile } = require('@utils/file-utils');

const { isNotNU } = require('@utils/tools');

/**
 *
 * delete payroll by id
 *
 * id String id of table payroll
 * returns Object
 **/
exports.deletePayrollsId = async function (id) {
  return await findAndDelete(id, Payroll);
};

/**
 * Your GET endpoint
 * get all payrolls
 *
 * returns Object
 **/
exports.getPayrolls = async function (query) {
  return await getAllEntities(query, Payroll);
};

/**
 * Your GET endpoint
 * download attachment
 *
 * id String id of payroll for get attachment of payroll
 * no response value expected for this operation
 **/
exports.getPayrollsAttachment = async function (id) {
  const payroll = await findAndGet(
    id,
    Payroll,
    {
      model: File,
      as: 'attachment',
    },
    false,
    true,
  );
  return isResponsePayload(payroll)
    ? payroll
    : downloadFile(payroll.attachment);
};

/**
 * Your GET endpoint
 * download company signature image
 *
 * id String id of payroll for get company signature image of payroll
 * no response value expected for this operation
 **/
exports.getPayrollsCompanysignature = async function (id) {
  const payroll = await findAndGet(
    id,
    Payroll,
    {
      model: File,
      as: 'company_signature',
    },
    false,
    true,
  );
  return isResponsePayload(payroll)
    ? payroll
    : downloadFile(payroll.company_signature);
};

exports.getPayrollsPdfImage = async function (id) {
  const payroll = await findAndGet(
    id,
    Payroll,
    {
      model: File,
      as: 'pdf_image',
    },
    false,
    true,
  );
  return isResponsePayload(payroll) ? payroll : downloadFile(payroll.pdf_image);
};

/**
 * Your GET endpoint
 * download employee signature image
 *
 * id String id of payroll for get employee signature image of payroll
 * no response value expected for this operation
 **/
exports.getPayrollsEmployeesignature = async function (id) {
  const payroll = await findAndGet(
    id,
    Payroll,
    {
      model: File,
      as: 'employee_signature',
    },
    false,
    true,
  );
  return isResponsePayload(payroll)
    ? payroll
    : downloadFile(payroll.employee_signature);
};

exports.saveFile = async function (files, payrollId) {
  const { FilesAndDirectories: fad } = config;
  const { employeeSignature, companySignature, signedDoc } = files;
  const empSignPath =
    employeeSignature != undefined
      ? await fileUtils.saveSingleFile(
          employeeSignature,
          fad.EmployeeSignature,
          payrollId,
        )
      : undefined;

  const compSignPath =
    companySignature != undefined
      ? await fileUtils.saveSingleFile(
          companySignature,
          fad.CompanySignature,
          payrollId,
        )
      : undefined;

  let paymentPath = undefined;
  if (signedDoc != undefined) {
    paymentPath = await fileUtils.saveSingleFile(
      signedDoc,
      fad.PayrollAttachment,
    );
  }
  return {
    employee_signature_pathFile: empSignPath,
    company_signature_pathFile: compSignPath,
    payment_pathFile: paymentPath,
  };
};

exports.attachFileToPayroll = async function (pathes, id) {
  const payroll = await Payroll.findByPk(id);
  let employee_signature_file = null;
  let company_signature_file = null;
  let payment_file = null;
  if (pathes.employee_signature_pathFile) {
    employee_signature_file = await File.create({
      file: pathes.employee_signature_pathFile,
      fileable_type: 'payroll',
      fileable_id: payroll.id,
    });
  }
  if (pathes.company_signature_pathFile) {
    company_signature_file = await File.create({
      file: pathes.company_signature_pathFile,
      fileable_type: 'payroll',
      fileable_id: payroll.id,
    });
  }
  if (pathes.payment_pathFile) {
    payment_file = await File.create({
      file: pathes.payment_pathFile,
      fileable_type: 'payroll',
      fileable_id: payroll.id,
    });
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_PDF,
      payment_file.id,
      'payrollPdfImage',
      'Payroll',
      payroll.id,
      'pdf_image_id',
    );
  }

  if (employee_signature_file !== null) {
    payroll.employee_signature_id = employee_signature_file.id;
    payroll.employee_signature_date = new Date();
  }

  if (company_signature_file !== null) {
    payroll.company_signature_id = company_signature_file.id;
    payroll.company_signature_date = new Date();
  }

  if (payment_file !== null) {
    payroll.payment_id = payment_file.id;
  }

  await payroll.save();
  return respondSuccess(payroll);
};

exports.updatePayrollsId = async function (id, body) {
  const payroll = await findAndGet(id, Payroll, false, false, true);
  if (isResponsePayload(payroll)) {
    return payroll;
  }
  if (
    body.company_signature_id != undefined &&
    (await Signature.findByPk(body.company_signature_id)) !== null
  ) {
    const company_signature = await Signature.findByPk(
      body.company_signature_id,
    );
    body.company_signature_id = company_signature.image_id;
    body.company_signature_date = new Date();
  } else if (body.company_signature_id != undefined) {
    return respondNotFound('company signature not found');
  }

  if (
    body.employee_signature_id != undefined &&
    (await Signature.findByPk(body.employee_signature_id)) !== null
  ) {
    const employee_signature = await Signature.findByPk(
      body.employee_signature_id,
    );
    body.employee_signature_id = employee_signature.image_id;
    body.employee_signature_date = new Date();
  } else if (body.employee_signature_id != undefined) {
    return respondNotFound('employee signature not found');
  }

  if (isNotNU(body.payment_id) && body.payment_id !== payroll.payment_id) {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_PDF,
      body.payment_id,
      'payrollPdfImage',
      'Payroll',
      id,
      'pdf_image_id',
    );
  }

  return await findAndUpdate(id, body, Payroll);
};

/**
 * Your GET endpoint
 * get a payroll by id
 *
 * id String id of table payroll
 * returns Object
 **/
exports.getPayrollsId = async function (id) {
  return await findAndGet(id, Payroll);
};

/**
 *
 * save a payroll
 *
 * body Body for now we ignore files and others (optional)
 * returns Object
 **/
exports.postPayrolls = async function (body, creator_id) {
  if (
    typeof body.employee_id == 'undefined' ||
    (await User.findByPk(body.employee_id)) === null
  ) {
    return respondBadRequest('user not found');
  }
  body.creator_id = creator_id;
  return respondCreated(await Payroll.create(body));
};

/**
 *
 * update should upload new signature or change some details
 *
 * id String id of table payroll
 * body Body update detail (optional)
 * returns Object
 **/
exports.putPayrollsId = async function (id, body) {
  const payroll = await findAndGet(id, Payroll, false, false, true);
  if (isResponsePayload(payroll)) {
    return payroll;
  }

  if (
    body.employee_signature_id != undefined &&
    (await Signature.findByPk(body.employee_signature_id)) !== null
  ) {
    const employeeSignature = await Signature.findByPk(
      body.employee_signature_id,
    );
    body.employee_signature_id = employeeSignature.image_id;
    body.employee_signature_date = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  } else if (body.employee_signature_id != undefined) {
    return respondBadRequest('employee signature not found');
  }

  if (
    body.company_signature_id != undefined &&
    (await Signature.findByPk(body.company_signature_id)) !== null
  ) {
    const companySignature = await Signature.findByPk(
      body.employee_signature_id,
    );
    body.company_signature_id = companySignature.image_id;
    body.company_signature_date = new Date()
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
  } else if (body.company_signature_id != undefined) {
    return respondBadRequest('compayny signature not found');
  }

  if (isNotNU(body.payment_id) && body.payment_id !== payroll.payment_id) {
    getEventEmitter().emit(
      GLOBAL_SAVE_IMAGE_OF_PDF,
      body.payment_id,
      'payrollPdfImage',
      'Payroll',
      id,
      'pdf_image_id',
    );
  }

  return await findAndUpdate(id, body, Payroll);
};

const attachImageOfPdf = async (pathOfFile, payroll) => {
  const file = fs.readFileSync(path.resolve(pathOfFile));
  const { FilesAndDirectories: fad, pdfMaker } = config;
  const form = new FormData();
  form.append('pdf', file);
  form.append('page_number', pdfMaker.pageNumber);
  form.append('density', pdfMaker.density);
  form.append('scale', pdfMaker.scale);

  const pdfImagesDir = path.join(fad.uploads, fad.payrollPdfImage);
  if (!fs.existsSync(pdfImagesDir)) {
    fs.mkdirSync(pdfImagesDir, {
      recursive: true,
    });
  }

  const pathOfPdf = path.join(
    fad.uploads,
    fad.payrollPdfImage,
    `${payroll.id}-pdf-page.png`,
  );
  const writer = fs.createWriteStream(path.resolve(pathOfPdf));
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
        fileable_id: payroll.id,
        fileable_type: 'payroll pdf image',
        file: pathOfPdf,
      });
      payroll.pdf_image_id = fileRecord.id;
      payroll.save();
    })
    .catch((err) => console.log(err));
};
