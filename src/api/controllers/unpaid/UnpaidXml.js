'use strict';

const utils = require('@utils/writer');
const UnpaidXml = require('@service/unpaid/UnpaidXmlService');

const { isResponsePayload } = require('@utils/response');
const { findAndGet } = require('@api/utils/request-handler');
const { downloadFile } = require('../file/file');
const {
  ContaplusUnpaidProcessor,
} = require('@api/service/unpaid/actions/generateContaplusFromUnpaids');

// TODO(erfan): maybe we can remove this function
const normalizeBody = (body) => {
  const result = {};

  for (const key in body) {
    if (key != 'xml_file') {
      result[key] = body[key].value;
    }
  }

  result.template = body.message_template.value;
  return result;
};

module.exports.deleteUnpaidXmlsId = function deleteUnpaidXmlsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidXml.deleteUnpaidXmlsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidXmls = function getUnpaidXmls(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UnpaidXml.getUnpaidXmls(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidXmlsId = function getUnpaidXmlsId(req, res, next) {
  const id = req.swagger.params.id.value;
  UnpaidXml.getUnpaidXmlsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUnpaidXmls = function postUnpaidXmls(req, res, next) {
  const body = req.swagger.params;
  UnpaidXml.postUnpaidXmls(
    normalizeBody(body),
    req.files.xml_file.data.toString('utf8'),
    req.files.xml_file,
    req.user,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putUnpaidXmlsId = function putUnpaidXmlsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  UnpaidXml.putUnpaidXmlsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.downloadXmlDocumentId = function downloadXmlDocumentId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UnpaidXml.downloadXmlDocumentId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        utils.writeFile(res, { ...media, buffer: media.data });
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.LoadXmlFromEmail = function LoadXmlFromEmail(req, res, next) {
  UnpaidXml.loadUnpaidXmlFiles(req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.LoadXmlFromSftp = function LoadXmlFromSftp(req, res, next) {
  UnpaidXml.loadUnpaidXmlFromSftp(req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUnpaidXmlsReversal = async function getUnpaidXmlsReversal(
  req,
  res,
) {
  try {
    const id = parseInt(req.query.id, 10);

    if (!id || isNaN(id)) {
      return res
        .status(400)
        .json({ message: 'Missing or invalid XML document ID' });
    }

    const result = await UnpaidXml.processReversalFromXmlDocumentId(id);

    if (isResponsePayload(result)) {
      return res.status(result.statusCode || 400).json(result);
    }

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('Content-Type', 'application/zip');
    res.send(result.buffer);
  } catch (err) {
    console.error('Error generating reversal:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', details: err.message });
  }
};

module.exports.getUnpaidContaplusZip = async function getUnpaidContaplusZip(
  req,
  res,
) {
  try {
    const { status, bank, month } = req.query;

    if (!status || !['paid', 'unpaid'].includes(status)) {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'status' (paid/unpaid)" });
    }

    if (!bank || !['Sabadell', 'Guisona', 'all'].includes(bank.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'bank' (sabadell/guisona/all)" });
    }

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res
        .status(400)
        .json({ message: "Missing or invalid 'month' (format: YYYY-MM)" });
    }

    const processor = new ContaplusUnpaidProcessor(
      status,
      bank.toLowerCase(),
      month,
    );

    const result = await processor.process();

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.setHeader('Content-Type', 'application/zip');
    res.send(result.buffer);
  } catch (err) {
    console.error('Error generating Contaplus ZIP:', err);
    res
      .status(500)
      .json({ message: 'Internal Server Error', details: err.message });
  }
};
