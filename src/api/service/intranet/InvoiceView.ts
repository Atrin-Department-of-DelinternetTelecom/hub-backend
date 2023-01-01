import { respondNotFound } from '@api/utils/response';
import { AnyModel, intranet, moozaic, system } from '@models';

const {
  GfInvoiceInvoice,
  GfClient,
  GfContract,
  InvoiceMoneyTypes,
  Country,
  InvoiceClientsInvoiceProfile,
  InvoiceLine,
  GfContractDataCell,
  GfContractDataFix,
  PaymentPeriodType,
  InvoicePaymentType,
  InvoiceSerie,
  GfContractHolderChange,
  Warehouse,
  GfCollaborator,
  InvoiceClient,
  UnpaidInvoice,
} = intranet;

const { MoozaicUser } = moozaic;

import { get as config } from '@config';
const templates = config('index.templates') as string;

import _ from 'lodash';
import moment from 'moment';
import ejs from 'ejs';
import path from 'path';
import { convertHtmlToPdf } from '@service/documents/WkToPdfService';
import assert from 'assert';
import { errors } from '@api/http/http_errors';

import {
  formatAddress,
  formatAddressHtmlInvoice,
  isoToCountryName,
} from './InvoiceInvoiceService';
import AireCdrService from './AireCdrService';
import FixCdrService from './FixCdrService';
import { Op } from 'sequelize';
import { SERVICE } from '@api/constants/contracts';
import { getListOfObjects, uploadFile } from '../file/fileService';

type SectionLinePreviewKey = SERVICE | 'WITHOUT_TYPE';
type SectionLineKey = SERVICE | '-';

type SectionLinePreview = Record<
  SectionLinePreviewKey,
  Record<string, AnyModel[]>
>;

type SectionLine = Record<SectionLineKey, AnyModel[]>;

type SectionRefKeyLine = Record<SectionLineKey, Record<string, AnyModel[]>>;

type LinesGroupedBySectionAndRefKeyTemp = Record<
  SectionLineKey,
  Record<string, TempPerSection>
>;

type TempPerSection = {
  _proc: Record<string, LineInfo>;
  _row?: AnyModel[];
};

type LinesGroupedBySectionAndContractKey = Record<
  SectionLineKey,
  Record<string, Record<string, LineInfo[]>>
>;

type LineInfo = {
  keyType: string;
  code: string;
  description: string;
  subtotal: number;
  total: number;
  refererKey: string;
  refererDays: string;
  count: number;
};

export const previewInvoiceId = async (
  invoiceId: number,
  { page, page_size }: { page?: number; page_size?: number },
) => {
  const limitOffsetObject: { limit?: number; offset?: number } = {};
  if (page && page_size) {
    limitOffsetObject.limit = page_size;
    limitOffsetObject.offset = page * page_size;
  }
  const invoice = (
    await GfInvoiceInvoice.findByPk(invoiceId, {
      include: [
        {
          model: GfClient,
          attributes: [
            'id',
            'name',
            'contactName',
            'contactFamilyName1',
            'contactFamilyName2',
            'fiscalId',
            'emailAddress',
            'iban',
            'bicName',
            'bic',
            'collaboratorId',
          ],
          as: 'client',
          required: false,
          include: [
            { model: GfCollaborator, as: 'collaborator', required: false },
          ],
        },
        {
          model: InvoiceLine,
          as: 'invoice_lines',
          ...limitOffsetObject,
          order: [['order', 'asc']],
        },
        {
          model: MoozaicUser,
          as: 'creator',
          required: false,
        },
        {
          model: Country,
          attributes: ['id', 'name', 'isoCode'],
          as: 'country',
          required: false,
        },
        {
          model: InvoiceMoneyTypes,
          as: 'money_type',
          required: false,
        },
        {
          model: PaymentPeriodType,
          as: 'period_type',
          required: false,
        },
        {
          model: Warehouse,
          as: 'shop',
          required: false,
        },
        {
          model: InvoicePaymentType,
          as: 'payment_type',
          attributes: ['id', 'name', 'type'],
          required: false,
        },
        {
          model: InvoiceSerie,
          as: 'invoice_serie',
          attributes: ['id', 'name', 'prefix', 'type'],
          required: false,
        },
        {
          model: UnpaidInvoice,
          as: 'unpaid_fee',
          required: false,
        },
      ],
    })
  )?.get({ plain: true });

  if (!invoice) {
    return respondNotFound(`invoice with id ${invoiceId} not found`);
  }

  let currentRefererKey = '';
  const lines: Record<string, AnyModel> = {};
  const shouldDelete: AnyModel[] = [];
  const groupedByContract: SectionLinePreview = {
    INTERNET: {},
    FIX: {},
    CELL: {},
    TV: {},
    SUBSCRIPTION: {},
    WITHOUT_TYPE: {},
  };
  invoice.invoice_lines = invoice.invoice_lines.map((line: AnyModel) => {
    const contractKey = line.refererKey ?? 'no_contract';
    const refererData = JSON.parse(line.refererData ?? '{}');
    const contractType = (
      refererData.type ?? 'WITHOUT_TYPE'
    ).toUpperCase() as keyof SectionLinePreview;

    if (!groupedByContract[contractType][contractKey]) {
      groupedByContract[contractType][contractKey] = [];
    }

    groupedByContract[contractType][contractKey]
      ? groupedByContract[contractType][contractKey].push(line)
      : (groupedByContract[contractType][contractKey] = [line]);

    const { lineKey } = generateUniqueKeysByPropsOfLines(line, invoice.date);
    const uniqueKey = contractKey + lineKey;
    const sameLine = lines[uniqueKey];
    if (!sameLine) {
      line.count = 1;
      lines[uniqueKey] = line;
    } else {
      lines[uniqueKey].count += 1;
      shouldDelete.push(line.id);
    }
    line.refContractKey = getRefContractKey(line.refererKey);
    if (line.refererKey !== currentRefererKey && line.refererKey) {
      line.isParent = true;
      currentRefererKey = line.refererKey;
      return line;
    }
    if (!line.refererKey) {
      line.isParent = true;
      return line;
    }
    return line;
  });

  let sortedLines: AnyModel[] = [];
  for (const [contractType, lines] of Object.entries(groupedByContract)) {
    const contractKeyList = Object.keys(lines).reverse();
    for (const contractKey of contractKeyList) {
      sortedLines = sortedLines.concat(lines[contractKey]);
    }
  }

  invoice.invoice_lines = sortedLines
    .filter((il) => !shouldDelete.includes(il.id))
    .map((il) => ({ ...il, units: generateUnit(il), subTotal: getPrice(il) }));
  return invoice;
};

const generateUnit = (line: AnyModel) => {
  let unit = '';
  const refererData = JSON.parse(line.refererData ?? '{}');
  if (line.count > 1) unit = `${line.count} x`;
  const refererDays = refererData?.days;
  if (refererDays) {
    const floatedRefererDays = Number(refererDays);
    const days = parseInt(refererDays);
    const restOfDay =
      Math.abs(floatedRefererDays) - Math.floor(floatedRefererDays);
    const hour = Math.ceil(restOfDay * 24);
    unit = unit + (days ? `${days}d ` : '') + (hour ? `${hour}h` : '');
  }
  return unit;
};

const getPrice = (line: AnyModel) => {
  return (
    (Number(line.unitPrice) * Number(line.units) * line.count * 100) /
    100
  ).toString();
};

const getRefContractKey = (refKey: string) => {
  return refKey
    ? `C${parseInt(refKey.replace('contractId:', '')).toLocaleString('en-US', {
        minimumIntegerDigits: 7,
        useGrouping: false,
      })}`
    : 'C0000000';
};

export const generateUniqueKeysByPropsOfLines = (
  line: AnyModel,
  invoiceDate: string,
) => {
  const refererData =
    typeof line.refererData === 'object'
      ? line.refererData
      : JSON.parse(line.refererData ?? '{}');
  let productRefKey = refererData?.productKey ?? line.productCode;
  const productTotal = line.total;
  let productRefKeyType = productRefKey.split(':')[0].toLowerCase();
  let productRefDays = refererData?.days ?? '0';

  if (moment('2017-04-01 00:00:00').isAfter(moment(invoiceDate))) {
    productRefKey = line.description;
    productRefKeyType = 'other';
    productRefDays = '0';
  }

  const lineKey = `${
    productRefKey.slice(-1) === ':'
      ? productRefKey.substring(0, productRefKey.length - 2)
      : productRefKey
  }.${productRefDays}.${productTotal}.${line.description}`;
  return {
    lineKey,
    productRefKeyType,
    productRefKey,
    productRefDays,
    productTotal,
  };
};

export const downloadInvoice = async function (
  invoice_id: number,
  { attachExtraInfo }: { attachExtraInfo: boolean },
) {
  //CacheInvoice: here you must get code from cache
  const { html, code } = await renderInvoiceHtml(invoice_id, {
    attachExtraInfo,
  });

  const pdf = await convertHtmlToPdf(html);

  let name = code.replaceAll('/', '-');
  if (!attachExtraInfo) name += '-preview';

  return {
    file: pdf,
    filename: `${name}.pdf`,
  };
};

export const cacheInvoice = async function (invoice_id: number) {
  const { html, code } = await renderInvoiceHtml(invoice_id, {
    attachExtraInfo: true,
  });

  const fileName = `${code.replaceAll('/', '-')}.pdf`;
  await convertHtmlToPdf(html, {
    fileName,
    name: 'hubMinIO',
    url: config('index.invoice.invoiceCacheRedirectUrl'),
  });
};

export const renderInvoiceHtml = async function (
  invoice_id: number,
  { attachExtraInfo } = { attachExtraInfo: false },
) {
  let invoice = (
    await GfInvoiceInvoice.findByPk(invoice_id, {
      include: [
        {
          model: GfClient,
          as: 'client',
          include: [
            { model: GfCollaborator, as: 'collaborator', required: false },
          ],
          required: false,
        },
        { model: InvoiceClient, as: 'invoice_client', required: false },
        { model: Country, as: 'country', required: false },
        { model: InvoiceLine, as: 'invoice_lines', required: false },
        { model: InvoiceSerie, as: 'invoice_serie', required: false },
        { model: InvoicePaymentType, as: 'payment_type', required: false },
        { model: InvoiceMoneyTypes, as: 'money_type', required: false },
        { model: PaymentPeriodType, as: 'period_type', required: false },
      ],
      order: [['invoice_lines', 'id', 'asc']],
    })
  )?.get({ plain: true });

  if (!invoice) {
    throw new errors.NotFound(`invoice with id ${invoice_id} not found`);
  }

  if (attachExtraInfo) {
    invoice = await attachExtraInfoToInvoice(invoice);
    assert(invoice, `invoice with id ${invoice_id} not found.`);
  }

  for (const invoice_line of invoice.invoice_lines) {
    invoice_line.refererData = JSON.parse(invoice_line.refererData);
  }

  const linesGroupedBySections: SectionLine = {
    INTERNET: [],
    FIX: [],
    CELL: [],
    TV: [],
    SUBSCRIPTION: [],
    '-': [],
  };

  for (const invoice_line of invoice.invoice_lines) {
    const refType = (invoice_line?.refererData?.type?.toUpperCase() ??
      '-') as keyof typeof linesGroupedBySections;
    linesGroupedBySections[refType].push(invoice_line);
  }

  const linesGroupedBySectionAndRefKey: SectionRefKeyLine = {
    INTERNET: {},
    FIX: {},
    CELL: {},
    TV: {},
    SUBSCRIPTION: {},
    '-': {},
  };
  for (const [contractType, lines] of Object.entries(linesGroupedBySections)) {
    const sameSectionType =
      contractType as keyof typeof linesGroupedBySectionAndRefKey;
    for (const line of lines) {
      const refKey = line.refererKey ? line.refererKey : '0';
      const newRefKey = `C${parseInt(
        refKey.replace('contractId:', ''),
      ).toLocaleString('en-US', {
        minimumIntegerDigits: 7,
        useGrouping: false,
      })}`;
      if (!linesGroupedBySectionAndRefKey[sameSectionType][newRefKey]) {
        linesGroupedBySectionAndRefKey[sameSectionType][newRefKey] = [];
      }
      linesGroupedBySectionAndRefKey[sameSectionType][newRefKey].push(line);
    }
  }

  const linesGroupedBySectionAndRefKeyTemp: LinesGroupedBySectionAndRefKeyTemp =
    {
      INTERNET: {},
      FIX: {},
      CELL: {},
      TV: {},
      SUBSCRIPTION: {},
      '-': {},
    };
  for (const [contractType, contractsLine] of Object.entries(
    linesGroupedBySectionAndRefKey,
  )) {
    for (const [contractKey, _row] of Object.entries(contractsLine)) {
      linesGroupedBySectionAndRefKeyTemp[
        contractType as keyof typeof linesGroupedBySectionAndRefKeyTemp
      ][contractKey] = {
        _row,
        _proc: {},
      };
    }
  }

  const flattedByContractKeys: LinesGroupedBySectionAndContractKey = {
    INTERNET: {},
    FIX: {},
    CELL: {},
    TV: {},
    SUBSCRIPTION: {},
    '-': {},
  };

  for (const [firstKey, contractsLine] of Object.entries(
    linesGroupedBySectionAndRefKeyTemp,
  )) {
    for (const contractId in contractsLine) {
      const allContracts = contractsLine[contractId];
      for (const line of allContracts._row ?? []) {
        const {
          productRefKey,
          productRefDays,
          productRefKeyType,
          lineKey,
          productTotal,
        } = generateUniqueKeysByPropsOfLines(line, invoice.date);

        if (!allContracts._proc[lineKey]) {
          allContracts._proc[lineKey] = {
            keyType: productRefKeyType,
            code: line.productCode,
            description: line.description,
            subtotal: line.subTotal,
            total: productTotal,
            refererKey: productRefKey,
            refererDays: productRefDays,
            count: 1,
          };
        } else allContracts._proc[lineKey].count++;
      }

      delete linesGroupedBySectionAndRefKeyTemp[
        firstKey as keyof typeof linesGroupedBySectionAndRefKeyTemp
      ][contractId]._row;

      const flatedLines: Record<string, LineInfo[]> = {};

      for (const [sectionKey, line] of Object.entries(
        linesGroupedBySectionAndRefKeyTemp[
          firstKey as keyof typeof linesGroupedBySectionAndRefKeyTemp
        ][contractId]._proc,
      )) {
        if (!flatedLines[line.keyType]) flatedLines[line.keyType] = [];
        flatedLines[line.keyType].push(line);
      }

      for (const key in flatedLines)
        if (!flatedLines[key].length) delete flatedLines[key];

      flattedByContractKeys[
        firstKey as keyof typeof linesGroupedBySectionAndRefKeyTemp
      ][contractId] = flatedLines;
    }
  }

  const flattenedLines = [];
  for (const [contractSection, contracts] of Object.entries(
    flattedByContractKeys,
  )) {
    for (const [contractId, referedTypes] of Object.entries(contracts)) {
      for (const [typeId, lines] of Object.entries(referedTypes)) {
        for (const [index, line] of Object.entries(lines)) {
          flattenedLines.push({
            section: contractSection,
            contract: contractId,
            type: typeId,
            data: line,
          });
        }
      }
    }
  }

  let iban = invoice.client.iban;
  const parts = invoice.refererKey ? invoice.refererKey.split(',') : [];
  let profileId = '0';
  for (const p of parts) {
    const pp = p.split(':');
    if (pp[0] === '[profileId') profileId = pp[1].replace(']', '');
  }

  if (profileId !== '0') {
    const invoiceProfile = await InvoiceClientsInvoiceProfile.findByPk(
      profileId,
    );
    assert(invoiceProfile, `invoice profile with id ${profileId} not found`);

    if (invoiceProfile.iban.trim() !== '') {
      iban = invoiceProfile.iban;
    }
  }
  iban = `***************${iban?.substring(15) ?? ''}`;

  invoice.clientFormatedAddress = formatAddressHtmlInvoice({
    postalCode: invoice.clientPostalCode,
    address: invoice.clientAddress,
    number: invoice.clientAddressNumber
      ? `, ${invoice.clientAddressNumber}`
      : '',
    city: invoice.clientCity,
    state: invoice.clientState,
    country: await isoToCountryName(invoice.clientCountryIso),
  });

  invoice.invoice_lines = flattenedLines;
  const chunkedFrontPages = _.chunk(invoice.invoice_lines, 19);
  let totalContractPage = 0;
  const chunkedContractDetails: Record<string, any[][]> = {};
  for (const [index, contract] of Object.entries(invoice.contracts ?? {}) as [
    string,
    any,
  ]) {
    const chunckedForContract = _.chunk(contract.consumptions.lines, 42);
    totalContractPage += chunckedForContract.length;
    chunkedContractDetails[index] = chunckedForContract;
  }
  const currentPage = 1;
  const totalPages = totalContractPage + chunkedFrontPages.length;

  const html = await ejs.renderFile(path.resolve(templates, 'invoice.ejs'), {
    invoice,
    chunkedFrontPages,
    currentPage,
    totalPages,
    iban,
    chunkedContractDetails,
  });

  return {
    html,
    code: invoice.code,
  };
};

const attachExtraInfoToInvoice = async (invoice: AnyModel) => {
  // extract contract ids and group them by their type (cell or fix)
  const contractsInfo = getAndGroupContractsByInvoiceLinesInfo(
    invoice.invoice_lines,
  );

  //get start and end of month by invoice date
  const startDate = moment(invoice.date)
    .startOf('month')
    .startOf('day')
    .subtract(1, 'months')
    .format('YYYY-MM-DD HH:mm:ss');
  const endDate = moment(invoice.date)
    .subtract(1, 'months')
    .endOf('month')
    .endOf('day')
    .format('YYYY-MM-DD HH:mm:ss');

  // attach additional info to fix and cell contracts and concat them toghether
  const contracts = [
    ...(await getAllRelatedDataForCellContract(
      contractsInfo.cell,
      startDate,
      endDate,
    )),
    ...(await getAllRelatedDataForFixContract(
      contractsInfo.fix,
      invoice.client.id,
      startDate,
      endDate,
    )),
  ];

  // attach contracts with extra info to invoice object
  invoice.contracts = contracts;
  return invoice;
};

const getAndGroupContractsByInvoiceLinesInfo = (invoice_lines: AnyModel[]) => {
  const contractsInfo: { cell: string[]; fix: string[] } = {
    cell: [],
    fix: [],
  };
  for (const line of invoice_lines) {
    if (line.refererKey && line.refererKey.split(':').length) {
      const contractId = line.refererKey.split(':')[1];
      const contractInfo = JSON.parse(line.refererData);
      if (contractInfo.type === 'FIX') contractsInfo.fix.push(contractId);
      if (contractInfo.type === 'CELL') contractsInfo.cell.push(contractId);
    }
  }
  return contractsInfo;
};

const getAllRelatedDataForCellContract = async (
  cellContractsIds: string[] | number[],
  startDate: string,
  endDate: string,
) => {
  const contracts = [];
  const cellContracts = await GfContract.findAll({
    where: { id: cellContractsIds },
    include: { model: GfContractDataCell, as: 'dataCell' },
  });
  const allLinesContractHistory =
    await AireCdrService.getConsumptionLinesForMultipleContracts(
      cellContracts,
      startDate,
      endDate,
      true,
    );
  for (const contract of cellContracts) {
    const lines = [];
    for (const l of allLinesContractHistory.data[contract.id]) {
      lines.push({
        date: moment(l.fecha).format('YYYY-MM-DD'),
        time: moment(l.fecha).format('HH:mm:ss'),
        type: l.serviceType,
        origin: l.origen,
        number: l.destino,
        duration: l.segundos,
        charge: l.importe,
        description: l.descripcion,
      });
    }
    if (lines.length) {
      contracts.push({
        id: contract.id,
        reference: contract.reference,
        state: contract.state,
        type: 'CELL',
        meta: { number: contract.dataCell.number },
        consumptions: {
          meta: {
            startDate,
            endDate,
          },
          lines,
        },
      });
    }
  }
  return contracts;
};

const getAllRelatedDataForFixContract = async (
  fixContractIds: string[] | number[],
  cliendId: number,
  startDate: string,
  endDate: string,
) => {
  const contracts = [];
  const fixContracts = await GfContract.findAll({
    where: { id: fixContractIds },
    include: [
      { model: GfContractDataFix, as: 'dataFix' },
      {
        model: GfContractHolderChange,
        as: 'holders',
        where: {
          state: 'done',
          changeDate: {
            [Op.gte]: startDate,
          },
        },
        required: false,
        order: [['changeDate', 'ASC']],
      },
    ],
  });

  const _lines = await FixCdrService.getConsumptionLinesForMultipleContracts(
    fixContracts,
    cliendId,
    startDate,
    endDate,
  );

  for (const contract of fixContracts) {
    const lines = [];
    for (const l of _lines.data[contract.id]) {
      lines.push({
        date: moment(l.fecha).format('YYYY-MM-DD'),
        time: moment(l.fecha).format('HH:mm:ss'),
        type: l.serviceType,
        origin: l.origen,
        number: l.destino,
        duration: l.segundos,
        charge: l.importe,
        description: l.descripcion,
      });
    }
    if (lines.length) {
      contracts.push({
        id: contract.id,
        reference: contract.reference,
        state: contract.state,
        type: 'FIX',
        meta: { number: contract.dataFix?.number ?? '' },
        consumptions: {
          meta: {
            startDate,
            endDate,
          },
          lines,
        },
      });
    }
  }
  return contracts;
};
