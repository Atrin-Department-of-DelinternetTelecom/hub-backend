'use strict';

import Contaplus from './contaplusManager';

import jszip from 'jszip';

import moment from 'moment';

import config from '@config';

import to from 'await-to-js';

import * as GfClientService from '../GfClientService';

import { downloadFile } from '@api/service/file/fileService';

import { errors } from '@api/http/http_errors';

import { AnyModel } from '@api/models';

const getXMLRemittanceFile = async (remittance: AnyModel) => {
  const [err, file] = await to(downloadFile(remittance.hubFile, 'remittance'));

  if (err)
    throw new errors.NotFound(
      `could not find or access to files related to this period`,
    );

  return file;
};

function getFileName(
  csvs: Awaited<ReturnType<typeof generateRemittanceCsv>>,
  details:
    | {
        remittance: AnyModel;
        code: string;
      }
    | {
        start: string;
        end: string;
      },
) {
  const uid = config.get('index.intranet.uid') ?? '';
  let subcuentasName = '';
  let diarioName = '';
  if ('start' in details) {
    const { start, end } = details;
    subcuentasName = `${uid}_subcuentas_${start}_${end}_${csvs.ref}.csv`;
    diarioName = `${uid}_diario_${start}_${end}_${csvs.ref}.csv`;
  } else {
    const { remittance, code } = details;
    const key = `${code.replace('/', '_')}-${remittance.hubFile.replace(
      '.',
      '_',
    )}`;
    subcuentasName = `${uid}_n_subcuentas_${key}_${csvs.ref}.csv`;
    diarioName = `${uid}_n_diario_${key}_${csvs.ref}.csv`;
  }
  return { subcuentasName, diarioName };
}

const generateRemittanceCsv = async (data: Buffer, code: string) => {
  const clients = await GfClientService.getInvoiceClientsMap();

  const contaplus = new Contaplus();
  const csvs = await contaplus.getRemitanceCsvFromSepaXml(data, clients, code);

  if (!csvs.success) {
    throw new errors.BadRequest(csvs.reason);
  }

  if (!('files' in csvs) || !csvs.files)
    throw new errors.BadRequest('could not generate contaplus');

  return csvs;
};

const zipCsvsForRemittance = async (
  csvs: Awaited<ReturnType<typeof generateRemittanceCsv>>,
  remittance: AnyModel,
  code: string,
) => {
  const { diarioName, subcuentasName } = getFileName(csvs, {
    remittance,
    code,
  });

  const zip = new jszip();
  zip.file(subcuentasName, csvs.files.subcuentas);
  zip.file(diarioName, csvs.files.diario);
  return zip;
};

const zipCsvsForInvoice = async (
  csvs: Awaited<ReturnType<typeof generateRemittanceCsv>>,
  period: { start: string; end: string },
) => {
  const { diarioName, subcuentasName } = getFileName(csvs, period);
  const zip = new jszip();
  zip.file(subcuentasName, csvs.files.subcuentas);
  zip.file(diarioName, csvs.files.diario);

  return zip;
};

export const contaplusremitance = async (remittance: AnyModel) => {
  const file = await getXMLRemittanceFile(remittance);

  const code = `A17/${remittance.id * 100 + 1}`;
  const csvs = await generateRemittanceCsv(file.data, code);

  const zip = await zipCsvsForRemittance(csvs, remittance, code);
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  return { filename: `${remittance.id}_${moment().unix()}.zip`, buffer };
};

export const contaplusinvoices = async (start: string, end: string) => {
  const clientsMap = await GfClientService.getInvoiceClientsMap();
  const csvs = await Contaplus.getInvoicesCsv({ start, end }, clientsMap);
  const zip = await zipCsvsForInvoice(csvs, { start, end });
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });

  return { filename: `remitance-invoices-${moment().unix()}.zip`, buffer };
};
