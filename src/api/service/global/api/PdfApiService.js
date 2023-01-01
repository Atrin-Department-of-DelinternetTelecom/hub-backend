'use strict';

const axios = require('axios').default;
const FormData = require('form-data');
const fs = require('fs');
const config = require('@config');
const path = require('path');
const _ = require('lodash');
const exceljs = require('exceljs');
const templates = config.get('index.templates');
const hbs = require('express-handlebars');
const handlebars = hbs.create({
  layoutsDir: path.resolve('@template'),
  defaultLayout: false,
});

const {
  respondBadRequest,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const { getFileExtension } = require('@utils/file-utils');

const { File } = require('@models').system;
const allModels = require('@models').allModels;
const setting = require('@utils/pdf-setting.js');
const {
  getEventEmitter,
  GLOBAL_SAVE_IMAGE_OF_PDF,
  GLOBAL_SAVE_IMAGE_OF_HANDLEBARS,
  GLOBAL_SAVE_IMAGE_OF_HTML,
} = require('@lib/emitter');

const AttachPdf = config.get('index.AttachPdf');
const fad = config.get('index.FilesAndDirectories');
const pdfMaker = config.get('index.pdfMaker');
const convertHandleBarsToPdf = config.get('index.convertHandleBarsToPdf');

const attachImageToPdf = async (signature, pdf_id, image) => {
  try {
    const pdf = await readExtFile(pdf_id, 'pdf');
    if (!pdf) {
      return respondBadRequest(`pdf file is wrong.`);
    }

    const form = new FormData();
    form.append('pdf', pdf);
    form.append('signature', signature);
    form.append('sign', image.data);

    const response = await axios
      .post(AttachPdf.url, form, {
        headers: form.getHeaders(),
        responseType: 'arraybuffer',
      })
      .catch((err) => console.log(err));

    if (_.isUndefined(response)) {
      return respondBadRequest('error attach sign to pdf');
    }

    const pathOfPdf = path.join(
      fad.uploads,
      fad.DefaultPath,
      `(${Date.now()})pdf-page.pdf`,
    );
    if (!fs.existsSync(path.join(fad.uploads, fad.DefaultPath))) {
      fs.mkdirSync(path.join(fad.uploads, fad.DefaultPath));
    }
    fs.writeFileSync(pathOfPdf, response.data);
    const newFile = await File.create({
      file: pathOfPdf,
      fileable_id: 0,
      fileable_type: 'attached image to pdf',
    });
    return respondSuccess(newFile);
  } catch (error) {
    return respondBadRequest('error attach sign to pdf');
  }
};

const readExtFile = async (file_id, ext) => {
  const fileModel = await File.findByPk(file_id);

  // check file record exist
  if (_.isNull(fileModel)) {
    return false;
  }

  // check file is pdf
  const extFile = getFileExtension({
    name: fileModel.file,
  });
  if (_.isUndefined(extFile) || extFile[0] !== ext) {
    return false;
  }

  // return file buffer
  return fs.readFileSync(path.resolve(fileModel.file));
};

const saveImageOfPdf = async (
  file_id,
  directory,
  model_name,
  model_id,
  column_name,
) => {
  const file = await readExtFile(file_id, 'pdf');
  if (!file) {
    return respondNotFound(`file not found`);
  }

  const Model = allModels[model_name];
  if (_.isNull(Model) || _.isUndefined(Model)) {
    return respondBadRequest('model not valid.');
  }

  const model_record = await Model.findByPk(model_id);
  if (_.isNull(model_record)) {
    return respondNotFound(`${model_name} with id ${model_id} not found`);
  }

  const form = new FormData();
  form.append('pdf', file);
  form.append('page_number', pdfMaker.pageNumber);
  form.append('density', pdfMaker.density);
  form.append('scale', pdfMaker.scale);

  const pdfImagesDir = !_.isUndefined(fad[directory])
    ? path.join(fad.uploads, fad[directory])
    : path.join(directory);
  if (!fs.existsSync(pdfImagesDir)) {
    fs.mkdirSync(pdfImagesDir, {
      recursive: true,
    });
  }

  const pathOfPdf = path.join(pdfImagesDir, `${model_id}-pdf-page.png`);
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
        fileable_id: model_record.id,
        fileable_type: directory,
        file: pathOfPdf,
      });
      model_record[column_name] = fileRecord.id;
      model_record.save();
    })
    .catch((err) => console.log(err.toJSON()));
};
getEventEmitter().on(
  GLOBAL_SAVE_IMAGE_OF_PDF,
  (file_id, directory, model_name, model_id, column_name) => {
    saveImageOfPdf(file_id, directory, model_name, model_id, column_name);
  },
);

const saveImageOfHandlebars = async (
  file_id,
  directory,
  model_name,
  model_id,
  column_name,
) => {
  try {
    const file = await readExtFile(file_id, 'handlebars');
    if (!file) {
      return respondNotFound(`file not found`);
    }

    const Model = allModels[model_name];
    if (_.isNull(Model) || _.isUndefined(Model)) {
      return respondBadRequest('model not valid.');
    }

    const model_record = await Model.findByPk(model_id);
    if (_.isNull(model_record)) {
      return respondNotFound(`${model_name} with id ${model_id} not found`);
    }

    const handlebarsFile = await File.findByPk(file_id);
    const convertHandleBarsToPdfForm = {
      html: fs.readFileSync(path.resolve(handlebarsFile.file)).toString(),
    };

    const pdfResponse = await axios.post(
      convertHandleBarsToPdf.url,
      convertHandleBarsToPdfForm,
      {
        responseType: 'arraybuffer',
      },
    );
    if (_.isUndefined(pdfResponse)) {
      return respondBadRequest('error attach sign to pdf');
    }

    const imageOfPdfForm = new FormData();
    imageOfPdfForm.append('pdf', pdfResponse.data);
    imageOfPdfForm.append('page_number', pdfMaker.pageNumber);
    imageOfPdfForm.append('density', pdfMaker.density);
    imageOfPdfForm.append('scale', pdfMaker.scale);

    const pdfImagesDir = !_.isUndefined(fad[directory])
      ? path.join(fad.uploads, fad[directory])
      : path.join(directory);
    if (!fs.existsSync(pdfImagesDir)) {
      fs.mkdirSync(pdfImagesDir, {
        recursive: true,
      });
    }

    const pathOfPdf = path.join(pdfImagesDir, `${model_id}-pdf-page.png`);
    const writer = fs.createWriteStream(path.resolve(pathOfPdf));
    axios
      .post(pdfMaker.url, imageOfPdfForm, {
        headers: {
          ...imageOfPdfForm.getHeaders(),
        },
        responseType: 'stream',
      })
      .then(async (response) => {
        response.data.pipe(writer);
        const fileRecord = await File.create({
          fileable_id: model_record.id,
          fileable_type: directory,
          file: pathOfPdf,
        });
        model_record[column_name] = fileRecord.id;
        model_record.save();
      })
      .catch((err) => console.log(err.toJSON()));
  } catch (error) {
    console.log(error);
  }
};

const generatePdfOfHandlebars = async (
  model_name,
  offset,
  limit,
  requestedId,
) => {
  try {
    const Model = allModels[model_name];
    if (_.isNull(Model) || _.isUndefined(Model)) {
      return respondBadRequest('model not valid.');
    }

    let query = {
      attributes: setting[model_name],
      limit,
      offset,
      raw: true,
    };

    // if (!attributes) {
    //     query = { ...query, attributes: setting[model_name] }
    // } else if (attributes) {
    //     query = { ...query, attributes }
    // }

    if (requestedId) {
      query = { ...query, where: { id: requestedId } };
    }

    const data = await Model.findAndCountAll(query);

    const template = await handlebars.render(
      path.resolve(templates, `table.handlebars`),
      {
        array: data.rows,
        modelName: model_name,
      },
    );

    const convertHandleBarsToPdfForm = {
      html: template,
    };

    const pdfResponse = await axios.post(
      convertHandleBarsToPdf.url,
      convertHandleBarsToPdfForm,
      {
        responseType: 'arraybuffer',
      },
    );

    if (_.isUndefined(pdfResponse)) {
      return respondBadRequest('error attach sign to pdf');
    }

    // fs.writeFileSync("a.pdf", pdfResponse.data)
    return pdfResponse.data;
  } catch (error) {
    console.log(error);
  }
};

const generatePdfOfHandlebarsGetAttributes = async (
  model_name,
  offset,
  limit,
  requestedId,
  attributes,
) => {
  try {
    const Model = allModels[model_name];
    if (_.isNull(Model) || _.isUndefined(Model)) {
      return respondBadRequest('model not valid.');
    }

    let query = {
      limit,
      offset,
      raw: true,
    };

    if (!attributes) {
      query = { ...query, attributes: setting[model_name] };
    } else if (attributes && attributes.length != 0) {
      query = { ...query, attributes };
    }

    if (requestedId) {
      query = { ...query, where: { id: requestedId } };
    }

    const data = await Model.findAndCountAll(query);

    const template = await handlebars.render(
      path.resolve(templates, `table.handlebars`),
      {
        array: data.rows,
        modelName: model_name,
      },
    );

    const convertHandleBarsToPdfForm = {
      html: template,
    };

    const pdfResponse = await axios.post(
      convertHandleBarsToPdf.url,
      convertHandleBarsToPdfForm,
      {
        responseType: 'arraybuffer',
      },
    );

    if (_.isUndefined(pdfResponse)) {
      return respondBadRequest('error attach sign to pdf');
    }

    // fs.writeFileSync("a.pdf", pdfResponse.data)
    return pdfResponse.data;
  } catch (error) {
    console.log(error);
  }
};

const generateExcelGetAttributes = async (
  model_name,
  offset,
  limit,
  requestedId,
  attributes,
  response,
) => {
  const Model = allModels[model_name];
  if (_.isNull(Model) || _.isUndefined(Model)) {
    return respondBadRequest('model not valid.');
  }

  let query = {
    limit,
    offset,
    raw: true,
  };

  if (!attributes) {
    query = { ...query, attributes: setting[model_name] };
  } else if (attributes && attributes.length != 0) {
    query = { ...query, attributes };
  }

  if (requestedId) {
    query = { ...query, where: { id: requestedId } };
  }

  const data = await Model.findAndCountAll(query);

  const workbook = new exceljs.Workbook();
  const sheet = workbook.addWorksheet('first page');
  sheet.state = 'visible';
  sheet.views = [{ rightToLeft: false }];

  const dataColumnNames = Object.keys(Object.assign({}, ...data.rows));

  sheet.columns = dataColumnNames;
  const rows = [];
  data.rows.forEach((r) => {
    const temp = [];
    for (const column of dataColumnNames) {
      temp.push(r[column]);
    }

    rows.push(temp);
  });

  sheet.addRow(dataColumnNames);
  sheet.addRows(rows);

  response.contentType(
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  response.header('Content-Disposition', `inline; filename=${model_name}.xlsx`);

  return await workbook.xlsx.write(response);
};

getEventEmitter().on(
  GLOBAL_SAVE_IMAGE_OF_HANDLEBARS,
  (file_id, directory, model_name, model_id, column_name) => {
    saveImageOfHandlebars(
      file_id,
      directory,
      model_name,
      model_id,
      column_name,
    );
  },
);

const saveImageOfHtml = async (
  file_id,
  directory,
  model_name,
  model_id,
  column_name,
) => {
  const file = await readExtFile(file_id, 'html');
  if (!file) {
    return respondNotFound(`file not found`);
  }

  const Model = allModels[model_name];
  if (_.isNull(Model) || _.isUndefined(Model)) {
    return respondBadRequest('model not valid.');
  }

  const model_record = await Model.findByPk(model_id);
  if (_.isNull(model_record)) {
    return respondNotFound(`${model_name} with id ${model_id} not found`);
  }

  //CHECKK check that we have to pass html(compiled html)
  const htmlFile = await File.findByPk(file_id);
  const convertHtmlToPdfForm = {
    html: fs.readFileSync(path.resolve(htmlFile.file)).toString(),
  };
  const pdfResponse = await axios.post(
    convertHandleBarsToPdf.url,
    convertHtmlToPdfForm,
    { responseType: 'arraybuffer' },
  );

  if (_.isUndefined(pdfResponse)) {
    return respondBadRequest('error attach sign to pdf');
  }

  const imageOfPdfForm = new FormData();
  imageOfPdfForm.append('pdf', pdfResponse.data);
  imageOfPdfForm.append('page_number', pdfMaker.pageNumber);
  imageOfPdfForm.append('density', pdfMaker.density);
  imageOfPdfForm.append('scale', pdfMaker.scale);

  const pdfImagesDir = !_.isUndefined(fad[directory])
    ? path.join(fad.uploads, fad[directory])
    : path.join(directory);
  if (!fs.existsSync(pdfImagesDir)) {
    fs.mkdirSync(pdfImagesDir, {
      recursive: true,
    });
  }

  const pathOfPdf = path.join(pdfImagesDir, `${model_id}-pdf-page.png`);
  const writer = fs.createWriteStream(path.resolve(pathOfPdf));
  axios
    .post(pdfMaker.url, imageOfPdfForm, {
      headers: {
        ...imageOfPdfForm.getHeaders(),
      },
      responseType: 'stream',
    })
    .then(async (response) => {
      response.data.pipe(writer);
      const fileRecord = await File.create({
        fileable_id: model_record.id,
        fileable_type: directory,
        file: pathOfPdf,
      });
      model_record[column_name] = fileRecord.id;
      model_record.save();
    })
    .catch((err) => console.log(err.toJSON()));
};
getEventEmitter().on(
  GLOBAL_SAVE_IMAGE_OF_HTML,
  (file_id, directory, model_name, model_id, column_name) => {
    saveImageOfHtml(file_id, directory, model_name, model_id, column_name);
  },
);

module.exports.saveImageOfHandlebars = saveImageOfHandlebars;
module.exports.saveImageOfHtml = saveImageOfHtml;
module.exports.saveImageOfPdf = saveImageOfPdf;
module.exports.generatePdfOfHandlebars = generatePdfOfHandlebars;
module.exports.attachImageToPdf = attachImageToPdf;
module.exports.generatePdfOfHandlebarsGetAttributes =
  generatePdfOfHandlebarsGetAttributes;
module.exports.generateExcelGetAttributes = generateExcelGetAttributes;

/**
 * Attach sign image to the PDF.
 *
 * @param  Buffer pdf       [description]
 * @param  Buffer signature [description]
 * @param  Array coordinates   [{"page":,"x":,"y":,"width":,"height":}]
 * @return Buffer           [description]
 */
exports.sign = async (pdf, sign, coordinates) => {
  try {
    const form = new FormData();
    form.append('pdf', pdf);
    form.append('sign', sign);
    form.append('signature', JSON.stringify(coordinates));

    const response = await axios.post(AttachPdf.url, form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
    });

    return _.isUndefined(response)
      ? respondBadRequest('error attach sign to pdf')
      : response.data;
  } catch (error) {
    console.log(error);
    return respondBadRequest('error attach sign to pdf');
  }
};

/**
 * Make image from given PDF for the given page.
 *
 * @param  Buffer pdf
 * @param  integer page
 * @param  object options
 * @return Buffer
 */
exports.snapshot = async (pdf, page = 1, options = {}) => {
  try {
    const form = new FormData();
    form.append('pdf', pdf);
    form.append('page_number', page);
    form.append('density', options.density ?? pdfMaker.density);
    form.append('scale', options.scale ?? pdfMaker.scale);

    const response = await axios.post(pdfMaker.url, form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer',
    });

    return _.isUndefined(response)
      ? respondBadRequest('error make snapshot from pdf')
      : response.data;
  } catch (error) {
    console.log(error);
    return respondBadRequest('error make snapshot from pdf');
  }
};
