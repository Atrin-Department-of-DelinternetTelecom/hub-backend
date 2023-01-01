'use strict';

const { Parser } = require('xml2js');
const _ = require('lodash');
const to = require('await-to-js').default;

const parser = new Parser({
  explicitArray: false,
  trim: true,
});

exports.rejectionReasons = {
  AC01: 'Incorrect account number',
  AC04: 'Closed account number',
  AC06: 'Blocked account',
  AG01: 'Account does not accept Direct Debits',
  AM04: 'Insufficient funds',
  BE05: 'Duplicate mandate reference',
  FF01: 'Invalid file format',
  MD01: 'Invalid mandate / Unauthorized operation',
  MD02: 'Mandate data missing or invalid',
  MD07: 'Debtor deceased',
  MD06: 'Refund request by debtor',
  MS02: 'Debtor not specified',
  MS03: 'Bank not specified',
  RC01: 'BIC incorrect',
  RR01: 'Debtor account closed',
  RR02: 'Debtor account blocked',
  SL01: 'Direct debit authorization cancelled',
  SL02: 'Scheme limit exceeded',
  TM01: 'Time-out error',
  AM05: 'Duplicate transaction',
  AM06: 'Duplicate file',
  MD03: 'Creditor identifier invalid',
  MD04: 'Mandate signature missing',
  MD05: 'Mandate number unknown',
  RC02: 'Invalid currency',
  RC03: 'Transaction forbidden on account',
  FF03: 'Message format error',
  FF04: 'Invalid amount',
  AM02: 'Rejected for technical reasons',
  AM03: 'Currency mismatch',
  RR03: 'Transaction rejected by debtor bank',
  RR04: 'Debtor bank not reachable',
};

/**
 * @param {any} tx
 * @returns {{
 *   invoiceId: string | null,
 *   invoiceCode: string | null,
 *   paymentId: string | null,
 *   rejectCode: string | null
 * } | null}
 */
const parseTxInfsAndSt = (tx) => {
  let invoiceId = null;
  let invoiceCode = null;
  let paymentId = null;

  const mndtId = tx?.OrgnlTxRef?.MndtRltdInf?.MndtId;
  const parts = mndtId?.split(':');

  if (parts && parts.length > 2) {
    invoiceId = parts[0] || null;
    invoiceCode = parts[1] || null;
    paymentId = parts[2] || null;
  }

  const rejectCode = tx?.StsRsnInf?.Rsn?.Cd || null;

  // if nothing parsed, skip
  if (!invoiceId && !invoiceCode && !paymentId) return null;

  return { invoiceId, invoiceCode, paymentId, rejectCode };
};

/**
 *
 * @param {any} obj
 * @returns {{code:string,rejectCode:string}[]}
 */
const intoInvoices = (obj) => {
  const invoices = [];
  let OrgnlPmtInfAndSts = obj?.Document?.CstmrPmtStsRpt?.OrgnlPmtInfAndSts;
  if (!Array.isArray(OrgnlPmtInfAndSts))
    OrgnlPmtInfAndSts = [OrgnlPmtInfAndSts];

  for (const OrgnlPmtInfAndSt of OrgnlPmtInfAndSts) {
    const txInfsAndSts = Array.isArray(OrgnlPmtInfAndSt.TxInfAndSts)
      ? OrgnlPmtInfAndSt.TxInfAndSts
      : [OrgnlPmtInfAndSt.TxInfAndSts];
    invoices.push(...txInfsAndSts.map(parseTxInfsAndSt).filter((v) => !!v));
  }

  return invoices;
};

/**
 *
 * @param {string} xml
 * @returns {Promise<{code:string,rejectCode:string}[]>}
 */
exports.parseUnpaidXml = async (xml) => {
  const [err, result] = await to(parser.parseStringPromise(xml));
  if (err) {
    throw new Error(`invalid xml file`);
  }

  const invoices = intoInvoices(result);
  if (!invoices || invoices.length === 0) {
    throw new Error(`invalid xml format`);
  }

  return invoices;
};
