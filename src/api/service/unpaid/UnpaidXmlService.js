'use strict';

const {
  intranet: { UnpaidXml, UnpaidInvoice, AutomaticUnpaidStatus },
  system: { File, User },
} = require('@models');
const path = require('path');
const { writeFile } = require('fs').promises;
const moment = require('moment');

const { fetchXmlFilesFromSftp } = require('./utils/sftp-utils');

const {
  respondBadRequest,
  respondSuccess,
  isResponsePayload,
} = require('@utils/response');

const {
  getAllEntities,
  findAndUpdate,
  findAndGet,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const UnpaidInvoiceService = require('./UnpaidInvoiceService');

const config = require('@config');
const to = require('await-to-js').default;
const {
  parseUnpaidXml,
  rejectionReasons,
} = require('./utils/unpaid-xml-parser');
const { GoogleMail } = require('../google/Gmail');
const { Op } = require('sequelize');

const assert = require('assert');
const ContaplusManager = require('@service/intranet/ContaplusService/contaplusManager');
const xml2js = require('xml2js');
const jszip = require('jszip');
const { GfInvoiceInvoice } = require('@models').intranet;
const fs = require('fs');
const util = require('util');
const { uploadFile, downloadFile } = require('../file/fileService');
const { firstPopulated } = require('@api/utils/helpers');
const readFile = util.promisify(fs.readFile);

/**
 *
 * deconste a basic information record by id
 *
 * id String
 * returns Object
 **/
exports.deleteUnpaidXmlsId = async function (id) {
  return findAndDeleteIntranet(id, UnpaidXml);
};

/**
 * Your GET endpoint
 * get all basic information record
 *
 * returns Object
 **/
exports.getUnpaidXmls = async function (query) {
  exports.calculateOldXmlInvoiceCounts();
  return getAllEntities(query, UnpaidXml);
};

/**
 * Your GET endpoint
 * get single basic information record by id
 *
 * id String
 * returns Object
 **/
exports.getUnpaidXmlsId = async function (id) {
  return findAndGet(id, UnpaidXml);
};

/**
 *
 * save basic information of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUnpaidXmls = async function (
  body,
  xml_file,
  xml_file_for_save,
  user,
) {
  const [error, invoices] = await to(parseUnpaidXml(xml_file));
  if (error) {
    return respondBadRequest(error.message);
  }

  const { filename } = await uploadFile(UnpaidXml.bucket(), xml_file_for_save);
  const relativePath = `uploads/${config.get(
    'index.FilesAndDirectories.XMLDocument',
  )}/${filename}`;

  const file = await File.create({
    file: relativePath,
    fileable_id: 0,
    fileable_type: 'xml document',
  });

  const invoice_xml = await UnpaidXml.create({
    ...body,
    file_id: file.id,
    total_invoices: invoices.length,
  });

  const results = [];

  for (const invoice of invoices) {
    body.invoiceId = invoice.invoiceId;
    body.invoice_code = invoice.invoiceCode;
    body.reason = rejectionReasons?.[invoice.rejectCode];
    body.xml_id = invoice_xml.id;
    body.template = firstPopulated([body.template, body.message_template]);
    results.push(await UnpaidInvoiceService.postUnpaidInvoices(body, user));
  }

  return respondSuccess({
    ...invoice_xml.get({ plain: true }),
    unpaid_invoices: results,
  });
};

/**
 *
 * update a basic information record by id
 *
 * id String
 * body Body in this example we want to change the
 * department of employee's basic information (optional)
 * returns Object
 **/
exports.putUnpaidXmlsId = async function (id, body) {
  return findAndUpdate(id, body, UnpaidXml);
};

exports.downloadXmlDocumentId = async function (id) {
  const xml = await findAndGet(
    id,
    UnpaidXml,
    {
      model: File,
      as: 'xml_document',
    },
    false,
    true,
  );

  if (isResponsePayload(xml)) {
    return xml;
  }

  const filename = path.basename(xml.xml_document.file);

  return downloadFile(filename, UnpaidXml.bucket());
};

exports.calculateOldXmlInvoiceCounts = async function () {
  const xmls = await UnpaidXml.findAll({
    where: {
      total_invoices: null,
    },
  });

  console.log('calculateOldXmlInvoiceCounts', xmls.length);

  for (const xml of xmls) {
    const count = await UnpaidInvoice.count({
      where: {
        xml_id: xml.id,
        status: 1,
      },
    });
    await xml.update({
      total_invoices: count,
    });
  }
};

exports.loadUnpaidXmlFiles = async function (user) {
  const [error] = await to(fetchAndProcessEmailAttachments(user));

  if (error)
    await AutomaticUnpaidStatus.create({
      method: 'email',
      bankName: 'guisona',
      state: 'error',
      fetchDate: new Date(),
      errorDescription: error.message,
    });

  return respondSuccess(`fetch xml file executed.`);
};

exports.loadUnpaidXmlFromSftp = async function (user) {
  const requiredEnvVars = [
    'SABADELL_SFTP_HOST',
    'SABADELL_SFTP_PORT',
    'SABADELL_SFTP_USERNAME',
    'SABADELL_SFTP_PRIVATE_KEY',
    'SABADELL_SFTP_DIR_PATH',
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingVars.length > 0) {
    console.warn(
      `[SFTP] Skipping execution: Missing required env vars: ${missingVars.join(
        ', ',
      )}`,
    );
    return respondSuccess(
      'Skipped SFTP load due to missing environment configuration.',
    );
  }

  if (!user) {
    user = await User.findOne({ where: { email: 'hub-app@delinternet.com' } });
    assert(user, 'hub app user not found');
  }

  const sftpConfig = {
    host: process.env.SABADELL_SFTP_HOST,
    port: parseInt(process.env.SABADELL_SFTP_PORT, 10),
    username: process.env.SABADELL_SFTP_USERNAME,
    privateKey: process.env.SABADELL_SFTP_PRIVATE_KEY,
    remotePath: process.env.SABADELL_SFTP_DIR_PATH,
  };

  const [error, files] = await to(fetchXmlFilesFromSftp(sftpConfig));

  if (error) {
    await AutomaticUnpaidStatus.create({
      method: 'sftp',
      bankName: 'sabadell',
      state: 'error',
      fetchDate: new Date(),
      errorDescription: error.message,
    });
    return respondBadRequest(error.message);
  }

  for (const file of files) {
    await exports.postUnpaidXmls(
      {
        source: 'sftp',
        template_id: 2,
        send_method: 'sms',
        msg_period: 14,
        msgs_per_period: 2,
        unpaid_fee: 7.5,
        message_template:
          '{name} s’ha d’abonar {fee_total}€ abans del {date} de la {code}. Info https://delinternet.com/pay',
        msg_hour: '2021-08-30 02:30:00',
        auto_execute: true,
        provider_name: 'Sabadell',
        filename: file?.filename,
      },
      file.data.toString('utf8'),
      {
        data: file.data,
        name: file.filename,
        mv: function (destinationPath) {
          const fullPath = path.join(destinationPath);
          writeFile(fullPath, this.data);
        },
      },
      user,
    );
    await AutomaticUnpaidStatus.create({
      method: 'sftp',
      bankName: 'sabadell',
      state: 'success',
      fetchDate: new Date(),
    });
  }

  return respondSuccess('SFTP XML files processed.');
};

const fetchAndProcessEmailAttachments = async (user) => {
  if (!user) {
    //default user for system cron action, we can use better query, because by changin Email, this code won't work
    user = await User.findOne({
      where: { email: 'hub-app@delinternet.com' },
    });
    assert(user, 'hub app user not found');
  }

  const gmail = new GoogleMail();

  const lastEmail = await UnpaidXml.findOne({
    where: { email_id: { [Op.not]: null } },
    order: [['creationDate', 'DESC']],
  });

  const listOfMessages = await gmail.getListOfMessages(
    `from:caixaguissona@caixaguissona.com AND has:attachment AND ${
      lastEmail
        ? `after:${moment(lastEmail.creationDate)
            .subtract(1, 'day')
            .format('YYYY-MM-DD')}`
        : ''
    }`,
  );

  const alreadyImportedViaEmail = {};
  (
    await UnpaidXml.findAll({
      where: {
        email_id: listOfMessages.map((message) => message.id),
      },
    })
  ).forEach((xml) => {
    alreadyImportedViaEmail[xml.email_id] = xml;
  });

  const messagesAttachments = {};
  for (const message of listOfMessages) {
    if (!alreadyImportedViaEmail[message.id]) {
      const attachments = await gmail.getMessageAttachments(message.id);
      if (attachments.length)
        messagesAttachments[message.id] = attachments.filter((attachment) =>
          attachment.filename.toLowerCase().endsWith('.xml'),
        );
    }
  }

  if (Object.keys(messagesAttachments).length > 0) {
    for (const [messageId, fileNameAndContent] of Object.entries(
      messagesAttachments,
    )) {
      await exports.postUnpaidXmls(
        {
          email_id: messageId,
          template_id: 2,
          send_method: 'sms',
          msg_period: 14,
          msgs_per_period: 2,
          unpaid_fee: 7.5,
          message_template:
            '{name} s’ha d’abonar {fee_total}€ abans del {date} de la {code}. Info https://delinternet.com/pay',
          msg_hour: '2021-08-30 02:30:00',
          auto_execute: true,
          provider_name: 'Guisona',
        },
        fileNameAndContent[0].data.toString('utf8'),
        {
          data: fileNameAndContent[0].data,
          name: fileNameAndContent[0].filename,
          mv: function (destinationPath) {
            const fullPath = path.join(destinationPath);
            writeFile(fullPath, this.data);
          },
        },
        user,
      );
    }
    await AutomaticUnpaidStatus.create({
      method: 'email',
      bankName: 'guisona',
      state: 'success',
      fetchDate: new Date(),
    });
  }
};

exports.processReversalFromXmlDocumentId = async function (id) {
  const xmlRecord = await findAndGet(
    id,
    UnpaidXml,
    {
      model: File,
      as: 'xml_document',
    },
    false,
    true,
  );

  if (isResponsePayload(xmlRecord)) return xmlRecord;

  const { data: buffer } = await exports.downloadXmlDocumentId(id);
  const xmlContent = buffer.toString('utf-8');

  return exports.generateReversalFromXml(xmlContent);
};

/**
 * Process pain.002 file and generate reversal CSVs (subcuentas, diario)
 * @param {string} xmlData - Raw XML content as string
 * @returns {Promise<{filename: string, buffer: Buffer}>}
 */
exports.generateReversalFromXml = async function (xmlData) {
  const parser = new xml2js.Parser();
  const parsed = await parser.parseStringPromise(xmlData);

  const txs =
    parsed?.Document?.CstmrPmtStsRpt?.[0]?.OrgnlPmtInfAndSts?.[0]?.TxInfAndSts;
  if (!txs || txs.length === 0) throw new Error('No transactions found in XML');

  // Filter rejected payments only
  const rejectedTxs = txs.filter((tx) => tx.TxSts?.[0] === 'RJCT');
  if (!rejectedTxs.length) throw new Error('No rejected transactions found');

  const controlSum =
    parsed?.Document?.CstmrPmtStsRpt?.[0]?.OrgnlGrpInfAndSts?.[0]
      ?.OrgnlCtrlSum?.[0];

  // Extract invoice IDs
  const invoiceIds = rejectedTxs
    .map((tx) => {
      const mandateId = tx.OrgnlTxRef?.[0]?.MndtRltdInf?.[0]?.MndtId?.[0];
      return mandateId?.split(':')[0];
    })
    .filter(Boolean);

  // Load corresponding invoices
  const dbInvoices = await GfInvoiceInvoice.findAll({
    where: { id: invoiceIds },
  });
  const invoicesMap = Object.fromEntries(
    dbInvoices.map((inv) => [String(inv.id), inv]),
  );

  // Init Contaplus Manager
  const contaplus = new ContaplusManager();
  contaplus.resetAssienNum();
  contaplus.ref = moment().format('mmss');

  const remittanceCode = `REV/${moment().format('YYMMDDHH')}`;
  contaplus.setRemitanceCode(remittanceCode);
  contaplus.initSageForRemitance(controlSum);

  for (const tx of rejectedTxs) {
    const txRef = tx.OrgnlTxRef?.[0];
    const mandateId = txRef?.MndtRltdInf?.[0]?.MndtId?.[0];
    const invoiceId = mandateId?.split(':')[0];
    const invoice = invoicesMap[invoiceId];

    if (!invoice) {
      console.warn(`Invoice not found for mandateId ${mandateId}`);
      continue;
    }

    const amount = parseFloat(txRef?.Amt?.[0]?.InstdAmt?.[0]?._);
    const date = txRef?.MndtRltdInf?.[0]?.DtOfSgntr?.[0];

    if (!isNaN(amount) && date) {
      // Create *negative* entry for reversal
      contaplus.addRemitance(invoice, -amount, date);
    }
  }

  const zip = new jszip();
  const files = contaplus.getFiles();
  zip.file(`reversal_subcuentas.csv`, files.subcuentas);
  zip.file(`reversal_diario.csv`, files.diario);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const filename = `reversal_${moment().format('YYYYMMDD_HHmmss')}.zip`;

  return { filename, buffer };
};
