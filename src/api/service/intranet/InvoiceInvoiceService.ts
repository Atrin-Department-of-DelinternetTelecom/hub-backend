// @ts-check
'use strict';
import { AnyModel, intranet, moozaic, system } from '@models';

const {
  GfInvoiceInvoice,
  GfClient,
  InvoiceMoneyTypes,
  Country,
  InvoiceClientsInvoiceProfile,
  InvoiceLine,
  InvoiceProduct,
  InvoiceTaxType,
  InvoiceUnits,
  InvoiceClient,
  PaymentPeriodType,
  InvoicePaymentType,
  InvoiceSerie,
  InvoicePayment,
  Warehouse,
  GfInvoiceControl,
  InvoiceProductTaxXref,
  GfCollaborator,
  UnpaidInvoice,
  GfSubscriberType,
  GfActiveFee,
  GfContract,
  GfInvoicePeriod,
  InvoiceNumera,
} = intranet;

const { MoozaicGlobalBusiness, MoozaicUser } = moozaic;

import { Op, col, fn, where } from 'sequelize';
import type { GfInvoiceInvoice as InvoiceType } from '@api/models/intranet/intranet_invoice_invoice';

import { get as config } from '@config';
import { create } from 'xmlbuilder2';

import {
  cancelDueInvoicePayments,
  createInvoicePaymentsForManualInvoice,
  getTotalFromInvoice,
} from '@service/intranet/PaymentService';

import { parseRefererKey } from '@service/intranet/InvoicePaymentService';

import NumeraService, { buildCode } from '@service/intranet/NumeraService';
import InvoiceProductService from './InvoiceProductService';
import Invoice_GfInvoiceControlService from './Invoice_GfInvoiceControlService';

import {
  getAllEntities,
  findAndGet,
  findAndDeleteIntranet,
} from '@utils/request-handler';
import { respondCreated } from '@utils/response';

import _ from 'lodash';
import moment from 'moment';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { fetch } from 'undici';
import { syncMtoN } from '@api/utils/sequelize';
import { Json } from 'sequelize/types/utils';
import {
  getGfInvoiceControlsInvoicedId,
  getGfInvoiceControlsThrowbackId,
} from './GfInvoiceControlService';

type CreateInvoice = {
  date: string;
  payDate: string;
  shopId?: number;
  moneyTypeCode: string;
  clientId: number;
  paymentType: number;
  paymentPeriodType: number;
  serieId: string;
  observations?: string;
  products: InvoiceLine[];
  clientName: string;
  clientNif: string;
  clientAddress: string;
  clientCity: string;
  clientPostalCode: string;
  clientState: string;
  clientCountryIso: string;
};

type TaxType = { id: string; name: string; value: number };

type InvoiceLine = {
  id: number;
  order: number;
  description: string;
  units: number;
  unitPrice: number;
  unitObject: AnyModel | null;
  discountPercentage: number;
  taxObject: TaxType[] | string;
  productId: number;
  includedTaxs: number;
  invoiceId?: number;
  productCode?: number;
};

type LinePayload = {
  id: number;
  unitPrice: number;
  units: number;
  productId: number;
  includedTaxs: number;
  invoiceId?: number;
  discountPercentage: number;
  taxes: string[];
  description: string;
  unitTypeId: string;
};

const _setLines = async (invoice: InvoiceType & { lines: LinePayload[] }) => {
  const lines = invoice.lines;
  const finalLines: InvoiceLine[] = [];
  let n = 0;
  const unitTypes = await getAllUnitTypes();
  const taxTypes = await getAllTaxTypes();
  for (const line of lines) {
    if (line.description) {
      const taxes = line.taxes;
      const taxObject: TaxType[] = [];
      for (const tax of taxes) {
        const taxType = taxTypes[tax];
        if (taxType)
          taxObject.push({
            name: taxType.name as string,
            value: taxType.value as number,
            id: tax as string,
          });
      }

      let unitObject = null;
      if (line.unitTypeId) {
        unitObject = unitTypes[line.unitTypeId];
      }

      finalLines.push({
        id: line.id,
        order: n++,
        description: line.description,
        units: line.units,
        unitPrice: line.unitPrice,
        unitObject,
        discountPercentage: line.discountPercentage,
        taxObject,
        productId: line.productId,
        includedTaxs: line.includedTaxs,
      });
    }
  }

  return setInvoiceLinesForManualInvoice(invoice, finalLines);
};

const getAllUnitTypes = async () => {
  const unitTypes: Record<string, AnyModel> = {};
  (await InvoiceUnits.findAll()).forEach((unit) => {
    unitTypes[unit.id] = unit;
  });
  return unitTypes;
};

const getAllTaxTypes = async () => {
  const taxTypes: Record<string, AnyModel> = {};
  (await InvoiceTaxType.findAll()).forEach((tax) => {
    taxTypes[tax.id] = tax;
  });
  return taxTypes;
};

export const setInvoiceLinesForManualInvoice = async (
  invoice: AnyModel,
  lines: InvoiceLine[],
) => {
  const invoiceId = invoice.id;
  const finalIds = _.map(lines, 'id');
  await InvoiceLine.update(
    {
      status: 0,
    },
    {
      where: {
        id: {
          [Op.notIn]: finalIds,
        },
        invoiceId,
      },
    },
  );

  const allRelatedLines: Record<string, AnyModel> = {};
  (
    await InvoiceLine.findAll({
      where: {
        invoiceId,
        id: finalIds,
      },
    })
  ).forEach((line) => {
    allRelatedLines[line.id] = line;
  });

  const allRelatedProducts =
    await InvoiceProductService.getIndexedInvoiceProducts();

  const toCreateInvoiceLines = [];
  const toUpdateInvoiceLines = [];
  const currentUpdateDate = new Date();
  for (const line of lines) {
    const row = allRelatedLines[line.id];
    const invoiceProduct = allRelatedProducts[line.productId];
    if (!row) {
      line.invoiceId = invoiceId;
      line.productCode = invoiceProduct ? invoiceProduct.code : '';
      const temp = _fillConsolidedTotals(line);

      const taxObject = temp.taxObject
        ? typeof temp.taxObject !== 'string'
          ? JSON.stringify(temp.taxObject)
          : temp.taxObject
        : null;

      const unitObject = temp.unitObject
        ? JSON.stringify(temp.unitObject)
        : 'null';

      const { id, ...tempToCreate } = temp;

      toCreateInvoiceLines.push({ ...tempToCreate, taxObject, unitObject });
    } else {
      const lineId = line.id;
      line.productCode = invoiceProduct?.code ?? '';
      const temp = _fillConsolidedTotals(line);
      const taxObject = JSON.stringify(temp.taxObject);
      temp.id = lineId;
      const updateDate = currentUpdateDate;
      const status = 1;
      toUpdateInvoiceLines.push({ ...temp, taxObject, updateDate, status });
    }
  }
  if (toCreateInvoiceLines.length)
    await InvoiceLine.bulkCreate(toCreateInvoiceLines);

  if (toUpdateInvoiceLines.length)
    await InvoiceLine.bulkCreate(toUpdateInvoiceLines, {
      updateOnDuplicate: [
        'productId',
        'productCode',
        'description',
        'units',
        'unitObject',
        'unitPrice',
        'discountPercentage',
        'discountTotal',
        'taxObject',
        'taxTotal',
        'includedTaxs',
        'subTotal',
        'total',
        'order',
        'status',
        'updateDate',
      ],
    });
  const updatedInvoice = await GfInvoiceInvoice.findByPk(invoice.id, {
    include: { model: InvoiceLine, as: 'invoice_lines' },
  });
  assert(updatedInvoice, 'inovice not found');
  return consolideTotals(updatedInvoice);
};

export const setInvoiceLinesForAutomaticInvoice = async (
  lines: InvoiceLine[],
) => {
  const allRelatedProducts =
    await InvoiceProductService.getIndexedInvoiceProducts();

  const toCreateInvoiceLines: InvoiceLine[] = [];
  for (const line of lines) {
    const invoiceProduct = allRelatedProducts[line.productId];

    line.productCode = invoiceProduct ? invoiceProduct.code : '';
    const temp = _fillConsolidedTotals(line);

    const taxObject = temp.taxObject
      ? typeof temp.taxObject !== 'string'
        ? JSON.stringify(temp.taxObject)
        : temp.taxObject
      : null;

    const unitObject = temp.unitObject
      ? JSON.stringify(temp.unitObject)
      : 'null';

    const { id, ...tempToCreate } = temp;

    toCreateInvoiceLines.push({ ...tempToCreate, taxObject, unitObject });
  }
  return toCreateInvoiceLines;
};

export const _fillConsolidedTotals = function (line: InvoiceLine | AnyModel) {
  line.discountPercentage = line.discountPercentage
    ? Number(line.discountPercentage)
    : 0;
  const taxobj = line.taxObject;
  const taxes = typeof taxobj === 'string' ? JSON.parse(taxobj) : taxobj;

  let taxPercetage = 0;
  let _subTotal;
  taxPercetage = taxes
    .map((item: TaxType) => item.value)
    .reduce((prev: number, curr: number) => prev + curr, 0);
  if (line.includedTaxs == 1) {
    _subTotal = (line.units * line.unitPrice) / (taxPercetage / 100);
  } else {
    _subTotal = line.units * line.unitPrice;
  }
  const discountTotal = (_subTotal / 100) * line.discountPercentage;
  let subTotal = _subTotal - discountTotal;
  let taxTotal = (subTotal / 100) * taxPercetage;

  subTotal = Math.round(subTotal * 100) / 100;
  taxTotal = Math.round(taxTotal * 100) / 100;

  return {
    ...('get' in line ? line.get({ plain: true }) : line),
    taxTotal,
    subTotal,
    total: subTotal + taxTotal,
    discountTotal,
  };
};

const consolideTotals = async function (invoice: AnyModel) {
  let baseTotal = 0;
  let total = 0;
  let taxesTotal = 0;
  const baseTotalXTaxs: Record<string, number> = {};
  const taxesTotalXTaxs: Record<string, number> = {};
  const taxsObjects: Record<string, TaxType> = {};
  const promises = [];

  for (const line of invoice.invoice_lines) {
    const temp = _fillConsolidedTotals(line);
    if (!_.isEqual(temp, line)) {
      promises.push(InvoiceLine.update(temp, { where: { id: temp.id } }));
    }

    const taxes = JSON.parse(line.taxObject) as TaxType[];
    for (const tax of taxes) {
      taxsObjects['taxId_' + tax.id] = tax;
      baseTotalXTaxs['taxId_' + tax.id] =
        (baseTotalXTaxs['taxId_' + tax.id] || 0) + temp.subTotal;
    }
    baseTotal += temp.subTotal;
  }
  // to save temps
  await Promise.all(promises);
  for (const key of Object.keys(baseTotalXTaxs)) {
    const to = taxsObjects[key];
    const subTotal = baseTotalXTaxs[key];
    let tax = (subTotal / 100) * to.value;
    tax = Math.round(tax * 100) / 100;
    taxesTotalXTaxs[key] = (taxesTotalXTaxs[key] || 0) + tax;
    taxesTotal += tax;
  }

  total = taxesTotal + baseTotal;

  if (
    invoice.baseTotal == baseTotal &&
    invoice.taxesTotal == taxesTotal &&
    invoice.total == total
  ) {
    return invoice;
  }

  invoice.baseTotal = baseTotal;
  invoice.taxesTotal = taxesTotal;
  invoice.total = convertFloatPartFrom01To00(total);

  return invoice.save();
};

export const consolideTotalsForAutomaticInvoice = (
  invoice: any,
  lines: InvoiceLine[],
) => {
  let baseTotal = 0;
  let total = 0;
  let taxesTotal = 0;
  const baseTotalXTaxs: Record<string, number> = {};
  const taxesTotalXTaxs: Record<string, number> = {};
  const taxsObjects: Record<string, TaxType> = {};

  for (const line of lines) {
    const temp = _fillConsolidedTotals(line);

    const taxes = JSON.parse(line.taxObject as string);
    for (const tax of taxes) {
      taxsObjects['taxId_' + tax.id] = tax;
      baseTotalXTaxs['taxId_' + tax.id] =
        (baseTotalXTaxs['taxId_' + tax.id] || 0) + temp.subTotal;
    }
    baseTotal += temp.subTotal;
  }

  for (const key of Object.keys(baseTotalXTaxs)) {
    const to = taxsObjects[key];
    const subTotal = baseTotalXTaxs[key];
    let tax = (subTotal / 100) * to.value;
    tax = Math.round(tax * 100) / 100;
    taxesTotalXTaxs[key] = (taxesTotalXTaxs[key] || 0) + tax;
    taxesTotal += tax;
  }

  total = taxesTotal + baseTotal;

  invoice.baseTotal = baseTotal;
  invoice.taxesTotal = taxesTotal;
  invoice.total = convertFloatPartFrom01To00(total);

  return invoice;
};

const createNonExisting = async (invoice: InvoiceType) => {
  if (!invoice.clientId) {
    const invoiceClient = await InvoiceClient.create({
      name: invoice.clientName,
      address: invoice.clientAddress,
      countryCode: invoice.clientCountryIso,
      city: invoice.clientCity,
      state: invoice.clientState,
      postalCode: invoice.clientPostalCode,
      defaultCurrencyCode: invoice.moneyTypeCode,
      defaultPaymentPeriodType: invoice.paymentPeriodType,
      defaultPaymentType: invoice.paymentType,
      nif: invoice.clientNif,
    });

    invoice.clientId = invoiceClient.id;
    invoice = await invoice.save();
  }

  for (const line of invoice.invoice_lines) {
    if (!line.productId) {
      const taxes = JSON.parse(line.taxObject) as TaxType[];

      const row = {
        name: line.description,
        description: '',
        price: line.unitPrice,
      };

      const invoiceProduct = await InvoiceProduct.create(row);
      syncMtoN(
        InvoiceProductTaxXref,
        'productId',
        invoiceProduct.id,
        'taxId',
        taxes.map((tax) => Number(tax.id)),
      );
      line.productId = invoiceProduct.id;
      line.productCode = invoiceProduct.code;
      await line.save();
    }
  }
};

const selectScope = (query: any) => {
  const payd = query.search?.whereQuery?.payd ?? null;
  delete query.search?.whereQuery?.payd;
  let model = GfInvoiceInvoice;
  if (['pending', 'paid', 'warning'].includes(payd)) model = model.scope(payd);
  return model;
};

export const formatAddressHtmlInvoice = function (address: {
  address: string;
  number: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}): string {
  const lines = [
    `${address.address || ''}${address.number ? `, ${address.number}` : ''}`,
    `${address.city || ''} ${address.postalCode || ''}`.trim(),
    `${address.state || ''} (${address.country || ''})`,
  ];

  // Filter out empty lines and join with newline characters
  return lines.filter((line) => line.trim() !== '').join(' ');
};

export const formatAddress = function (address: {
  address: string;
  number: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
}) {
  const result =
    address.address ??
    '' + ' ' + address.number ??
    '' + '\n' + address.city ??
    '' + ' ' + address.postalCode ??
    '' + '\n' + address.state ??
    '' + ' (' + address.country ??
    '' + ')';
  return result;
};

export const isoToCountryName = async (isoCode: string) => {
  const country = await Country.findOne({
    where: {
      isoCode,
    },
  });
  if (!country) {
    throw new Error(`Country with isoCode:${isoCode} not found`);
  }
  return country.name;
};

export const issueInvoice = async function (
  invoice: AnyModel,
  onlyData = false,
) {
  if (!(Number(invoice.total) > 0))
    throw Error('total amount must be more than 0');

  if (invoice.state !== 'proforma') throw Error('Inapropiated invoice state');

  const business = await MoozaicGlobalBusiness.findOne({
    where: {
      uid: config('index.intranet.uid'),
    },
  });

  if (!business) throw new Error('No business assigned! (889):update_business');

  business.country = await isoToCountryName(business.isoCode);
  business.formatedAddress = formatAddress({
    address: business.address,
    city: business.city,
    state: business.state,
    postalCode: business.postalCode,
    country: business.country,
    number: '',
  });

  invoice.sellerName = business.name;
  invoice.sellerNif = business.nif;
  invoice.sellerFormatedAddress = business.formatedAddress;

  const nextCode = await NumeraService.getNextCode('invoice', invoice.serieId);
  invoice.invoiceId = nextCode.value;
  invoice.code = nextCode.code;
  invoice.serieId = nextCode.serieId;

  const moneyType = (
    await InvoiceMoneyTypes.findOne({
      where: {
        code: invoice.moneyTypeCode,
      },
      attributes: ['id', 'name', 'code', 'conversion', 'symbol', 'uid'],
    })
  )?.get({ plain: true });

  // in old system and database, props with type number, was saved string
  invoice.moneyTypeObject = JSON.stringify(moneyType, (key, value) => {
    if (['id', 'conversion', 'uid'].includes(key)) return `${value}`;
    return value;
  });
  invoice.state = 'issued';

  if (!onlyData) {
    invoice = await invoice.save();
  }

  return invoice;
};

export const duplicateInvoice = async function (
  invoiceId: number,
  userId: number,
) {
  const invoice =
    (
      await GfInvoiceInvoice.findByPk(invoiceId, {
        include: [
          {
            model: InvoiceLine,
            as: 'invoice_lines',
            required: false,
          },
        ],
      })
    )?.get({ plain: true }) ?? null;

  if (!invoice) throw new errors.NotFound(`Invalid invoice (${invoiceId})`);

  delete invoice.id;
  invoice.serieId = null;
  invoice.invoiceId = null;
  invoice.code = null;
  invoice.state = 'proforma';
  invoice.copyFrom = invoiceId;
  invoice.date = new Date();
  invoice.userId = userId;

  const newInvoice = await GfInvoiceInvoice.create(invoice);

  const lines = [];
  for (const line of invoice.invoice_lines) {
    delete line.id;
    line.invoiceId = newInvoice.id;
    lines.push(line);
  }
  await InvoiceLine.bulkCreate(lines);

  // TODO
  // InvoiceStaticsManager::duplicated($invoice['id']);

  return newInvoice;
};

const rectificateInvoice = async function (invoice: AnyModel, userId: number) {
  const inverseSerie = invoice.serieId * -1;
  const nextCode = await NumeraService.getNextCode('invoice', inverseSerie);
  const newInvoice = await GfInvoiceInvoice.create({
    invoiceId: nextCode.value,
    code: nextCode.code,
    serieId: inverseSerie,
    state: 'rectificative',
    rectificativeFrom: invoice.id,
    total: invoice.total * -1,
    baseTotal: invoice.baseTotal * -1,
    taxesTotal: invoice.taxesTotal * -1,
    date: new Date(),
    payDate: new Date(),
    clientId: invoice.clientId,
    clientName: invoice.clientName,
    clientNif: invoice.clientNif,
    clientAddress: invoice.clientAddress,
    clientAddressNumber: invoice.clientAddressNumber,
    clientCity: invoice.clientCity,
    clientPostalCode: invoice.clientPostalCode,
    clientState: invoice.clientState,
    clientCountryIso: invoice.clientCountryIso,
    sellerName: invoice.sellerName,
    sellerNif: invoice.sellerNif,
    sellerFormatedAddress: invoice.sellerFormatedAddress,
    moneyTypeCode: invoice.moneyTypeCode,
    moneyTypeObject: invoice.moneyTypeObject,
    paymentPeriodType: invoice.paymentPeriodType,
    paymentType: invoice.paymentType,
    userId,
  });

  const canceledLines = [];
  for (const line of invoice.invoice_lines) {
    canceledLines.push({
      invoiceId: newInvoice.id,
      units: line.units * -1,
      productId: line.productId,
      productCode: line.productCode,
      description: line.description,
      unitObject: line.unitObject,
      unitPrice: line.unitPrice,
      discountPercentage: line.discountPercentage,
      discountTotal: line.discountTotal,
      taxObject: line.taxObject,
      taxTotal: line.taxTotal,
      includedTaxs: line.includedTaxs,
      subTotal: line.subTotal,
      total: line.total,
      order: line.order,
      blocked: line.blocked,
      blockedReason: line.blockedReason,
      refererApp: line.refererApp,
      refererKey: line.refererKey,
      refererData: line.refererData,
    });
  }
  await InvoiceLine.bulkCreate(canceledLines);

  invoice.state = 'canceled';
  await invoice.save();
  return invoice;
};

export const consolidePayments = async function (invoiceId: number) {
  const invoice = await GfInvoiceInvoice.findByPk(invoiceId);
  if (!invoice)
    return new errors.NotFound(
      `Invoice not found consolidePayments(${invoiceId})`,
    );

  invoice.cons_totalPaid = await getTotalFromInvoice(invoiceId);

  if (!invoice.actualPayDate && invoice.cons_totalPaid === invoice.total)
    invoice.actualPayDate = new Date();
  else if (invoice.actualPayDate && invoice.cons_totalPaid !== invoice.total)
    invoice.actualPayDate = null;

  return invoice.save();
};

export const changeState = async function (
  invoiceId: number,
  newState: string,
  userId: number,
  duplicate = false,
) {
  const invoice = await GfInvoiceInvoice.findByPk(invoiceId, {
    include: [
      {
        model: InvoiceLine,
        as: 'invoice_lines',
        required: false,
      },
    ],
  });

  if (!invoice)
    throw new errors.NotFound(`invoice with id ${invoiceId} not found`);

  const oldState = invoice.state;

  switch (newState) {
    case 'proforma':
      if (oldState != '' && oldState != 'proforma') {
        throw new errors.BadRequest(`Inapropiated state ("${oldState}")`);
      }
      newState = 'proforma';
      break;
    case 'canceled':
      if (oldState != 'issued') {
        throw new errors.BadRequest(`Inapropiated state ("${oldState}")`);
      }
      newState = 'canceled';
      await cancelDueInvoicePayments(invoiceId);
      await rectificateInvoice(invoice, userId);
      break;
    case 'issued': {
      if (oldState != 'proforma') {
        throw new errors.BadRequest(`Inapropiated state ("${oldState}")`);
      }
      newState = 'issued';
      await createInvoicePaymentsForManualInvoice(await issueInvoice(invoice));
      break;
    }
    default:
      throw new errors.BadRequest(`Inapropiated state ("${oldState}")`);
  }

  if (newState != 'canceled') {
    invoice.state = newState;
    await invoice.save();
  }
  // duplicate
  if (newState == 'canceled' && duplicate) {
    return duplicateInvoice(invoiceId, userId);
  }

  return invoice;
};

export const getInvoiceInvoicesCode = async function (code: string) {
  return GfInvoiceInvoice.findAll({
    where: {
      code: {
        [Op.like]: `%${code ? code : ''}%`,
      },
    },
    limit: 10,
    include: {
      model: GfClient,
      attributes: [
        'id',
        'name',
        'contactName',
        'contactFamilyName1',
        'contactFamilyName2',
        'fiscalId',
        'emailAddress',
      ],
      as: 'client',
    },
  });
};

export const postInvoiceInvoices = async function (
  body: CreateInvoice,
  userId: number,
) {
  if (!body.products || !body.products.length)
    throw new errors.BadRequest(`invalid inovice line`);

  let invoice = (
    await GfInvoiceInvoice.create({
      ...body,
      code: `TMP-${Math.floor(
        Math.random() * (999999999 - 111111111 + 1) + 111111111,
      )}`,
      userId,
    })
  ).get({ plain: true });
  invoice.lines = body.products;
  invoice = await _setLines(invoice);
  await createNonExisting(invoice);
  return respondCreated(invoice);
};

export const getInvoiceInvoicesId = async function (id: number) {
  return findAndGet(id, GfInvoiceInvoice, [
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
      include: [{ model: GfCollaborator, as: 'collaborator', required: false }],
    },
    {
      model: InvoiceLine,
      as: 'invoice_lines',
      required: false,
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
    {
      model: UnpaidInvoice,
      as: 'unpaid_invoice',
      required: false,
    },
  ]);
};

export const getRelatedInvoice = async function (id: number) {
  const unpaidInvoice = await UnpaidInvoice.findOne({
    attributes: ['id', 'invoice_id', 'invoice_commission_id'],
    where: {
      [Op.or]: [{ invoice_id: id }, { invoice_commission_id: id }],
    },
  });

  if (!unpaidInvoice) {
    throw new errors.NotFound(`unpaid invoice not found`);
  }

  const currentInvoiceType =
    unpaidInvoice.invoice_id === id ? 'quota' : 'commission';

  if (currentInvoiceType === 'commission') {
    return {
      type: 'quota',
      id: unpaidInvoice.invoice_id,
    };
  }

  if (unpaidInvoice.invoice_commission_id) {
    return {
      type: 'commission',
      id: unpaidInvoice.invoice_commission_id,
    };
  }

  throw new errors.NotFound(`Unpaid invoice has no related invoice`);
};

/**
 * Your GET endpoint
 * get all invoice invoice record
 *
 * returns Object
 **/
export const getInvoiceInvoices = async function (query: any) {
  const model = selectScope(query);
  return getAllEntities(query, model, undefined, [
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
      ],
      as: 'client',
      required: false,
    },
    {
      model: UnpaidInvoice,
      as: 'unpaid_invoice',
      required: false,
    },
    {
      model: InvoicePaymentType,
      as: 'payment_type',
    },
  ]);
};

/**
 *
 * update a invoice invoice record by id
 *
 * id String
 * returns Object
 **/
export const putInvoiceInvoicesId = async function (
  id: number,
  body: CreateInvoice,
) {
  let invoice = (await GfInvoiceInvoice.findByPk(id)) as InvoiceType;
  if (!invoice) throw new errors.NotFound(`invoice with id ${id} not found.`);
  if (!body.products || !body.products.length)
    throw new errors.BadRequest(`invalid inovice line`);

  await invoice.update(body);
  //@ts-ignore
  invoice = await _setLines({
    ...invoice.get({ plain: true }),
    lines: body.products,
  });
  await createNonExisting(invoice);
  const updatedInvoice = await GfInvoiceInvoice.findByPk(invoice.id, {
    include: { model: InvoiceLine, as: 'invoice_lines' },
  });
  assert(updatedInvoice, 'invoice not found');
  await consolideTotals(updatedInvoice);
  await _consolideRow(invoice);
  return invoice;
};

export const _consolideRow = async (invoice: AnyModel) => {
  const keys = parseRefererKey(invoice.refererKey);
  if ('gfClient' in keys && 'periodId' in keys) {
    const invoiceControl = await GfInvoiceControl.findOne({
      where: {
        clientId: keys.gfClient,
        periodId: keys.periodId,
        invoiceProfileId: keys.profileId,
      },
    });
    assert(invoiceControl, 'invoice control not found');
    const { control } = await Invoice_GfInvoiceControlService.consolideControl(
      invoiceControl,
      invoice,
    );
    await control?.save();
  }
};

export const deleteInvoiceInvoicesId = async function (id: number) {
  const found = await GfInvoiceInvoice.findByPk(id);
  if (!found)
    throw new errors.NotFound(`GfInvoiceInvoice with id:${id} was not found`);

  if (['issued', 'canceled', 'rectificative'].includes(found.state)) {
    throw new errors.BadRequest(
      `Invoice with id:${id} (${found.state}) cannot be delete`,
    );
  }

  return findAndDeleteIntranet(id, GfInvoiceInvoice);
};

const getInvoiceProductByFeeCommission = async (feeCommission: number) => {
  let invoiceProduct = await InvoiceProduct.findOne({
    where: { name: `Comissio (${feeCommission})` },
  });

  if (!invoiceProduct) {
    const newInvoiceProduct = {
      name: `Comissio (${feeCommission})`,
      code: '',
      price: `${feeCommission}`,
      costPrice: '0',
      includedTaxs: 0,
      unitTypeId: 3,
      noBillable: 0,
      description: `Comissio (${feeCommission})`,
      lineDescriptions: '',
      taxes: JSON.stringify([{ name: 'IVA', value: '21', id: '1' }]),
    };
    const newProductResponse = await InvoiceProductService.createInvoiceProduct(
      newInvoiceProduct,
    );
    const newInvoiceProductId = newProductResponse.payload?.data?.id ?? 0;
    if (!newInvoiceProductId) {
      return [{ id: newInvoiceProductId }];
    }
    invoiceProduct = await InvoiceProduct.create(newInvoiceProduct);
  }

  return [
    {
      id: invoiceProduct.id as number,
      productId: invoiceProduct.id as number,
      description: invoiceProduct.name as string, // here we should add the invoice code that causes this commission
      unitPrice: invoiceProduct.price as number,
      includedTaxs: 0,
      discountPercentage: 0,
      unitTypeId: null,
      units: 1,
      taxes: "['1']",
    },
  ];
};

export const createPaidCommissionInvoice = async (
  invoiceId: number,
  baseFeeCommission: number,
  user: AnyModel,
  shopId: number,
  paymentType: number,
) => {
  const invoice = await GfInvoiceInvoice.findByPk(invoiceId, {
    include: { model: InvoiceClient, as: 'invoice_client' },
  });
  assert(invoice, 'invoice not found');

  const feeCommission = Math.round((baseFeeCommission / 1.21) * 100) / 100;

  //add new invoice
  const newInvoiceCommissionDate = {
    clientName: invoice.invoice_client.businessName as string,
    clientId: invoice.invoice_client.id as number,
    clientNif: invoice.invoice_client.nif as string,
    clientCity: invoice.invoice_client.city as string,
    clientPostalCode: invoice.invoice_client.postalCode as string,
    clientState: invoice.invoice_client.state as string,
    clientCountryIso: invoice.invoice_client.countryCode as string,
    clientAddress: invoice.invoice_client.clientAddress as string,
    moneyTypeCode: 'EUR' as string,
    serieId: await getLastSeriId(),
    paymentPeriodType: 1,
    paymentType,
    date: moment().format('YYYY-MM-DD'),
    payDate: moment().format('YYYY-MM-DD'),
    products: (await getInvoiceProductByFeeCommission(
      feeCommission,
    )) as InvoiceLine[],
    shopId,
  };

  // check that we have valid invoice seri
  if (!newInvoiceCommissionDate.serieId)
    throw new Error(`invalid invoice seri`);

  // check validation for selected invoice product
  if (!newInvoiceCommissionDate.products[0].id)
    throw new Error('invalid product for invoice fee commission');

  const invoice_response = await postInvoiceInvoices(
    newInvoiceCommissionDate,
    user.userId,
  );

  //check the response of create new invoice to continue the process
  const invoice_commission_id =
    'data' in invoice_response.payload ? invoice_response.payload.data.id : 0;
  if (!invoice_commission_id)
    throw new Error('could not create fee commission invoice');

  //set as issued created invoice and check the result of created issue
  await changeState(invoice_commission_id, 'issued', user.userId);

  //set as paid created payments related to commission invoice
  await setAsPaidPaymentOfInvoice(invoice_commission_id, user.userId, shopId);

  // update invoice total paid column
  await consolidePayments(invoice_commission_id);

  return invoice_commission_id;
};

const setAsPaidPaymentOfInvoice = async (
  invoiceId: number,
  setPaidUserId: number,
  shopId: number,
) => {
  await InvoicePayment.update(
    {
      state: 'paid',
      setPaidUserId,
      shopId,
    },
    {
      where: {
        invoiceId: invoiceId,
      },
    },
  );

  await GfInvoiceInvoice.update(
    {
      actualPayDate: new Date(),
      cons_totalPaid: await getTotalFromInvoice(invoiceId),
    },
    { where: { id: invoiceId } },
  );
};

const getLastSeriId = async () => {
  const lastInvoiceSeri = await InvoiceSerie.findOne({
    where: { prefix: `F${moment().format('YY')}` },
  });
  return lastInvoiceSeri ? lastInvoiceSeri.id : 0;
};

const toFixed6 = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0.000000';
  // Ensure dot-decimal and exactly 6 digits
  return n.toFixed(6);
};

const toFixed2 = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
};

const normalizeUnitOfMeasure = (raw: any) => {
  const s = String(raw ?? '').trim();

  // If already a valid Factura-e UnitOfMeasure code: 01..35
  if (/^(0[1-9]|[12][0-9]|3[0-5])$/.test(s)) return s;

  // Common bad inputs: "1", "1.0", "1.00" -> default to "01" (Units)
  if (/^\d+(\.\d+)?$/.test(s)) return '01';

  // If you have text values, map them here if needed (optional):
  // if (s.toLowerCase().includes('hour')) return '02';

  // Safe default
  return '01';
};

export const convertInvoicesToXML = async (invoiceIds: number[]) => {
  const invoices = await GfInvoiceInvoice.findAll({
    where: { id: invoiceIds },
    include: [
      { model: InvoiceLine, as: 'invoice_lines' },
      { model: InvoiceSerie, as: 'invoice_serie' },
      {
        model: GfClient,
        as: 'client',
        include: [{ model: GfSubscriberType, as: 'subscriberType' }],
      },
      { model: InvoicePayment, as: 'payments' },
      {
        model: GfInvoiceControl,
        as: 'control_row',
        required: false,
        include: [
          {
            model: InvoiceClientsInvoiceProfile,
            as: 'invoice_profile',
            required: false,
          },
        ],
      },
    ],
  });

  if (invoices.length !== new Set(invoiceIds).size)
    throw new errors.NotFound(`some invoices not found`);

  const business = await MoozaicGlobalBusiness.findOne({
    where: {
      uid: config('index.intranet.uid'),
    },
  });

  if (!business)
    throw new errors.InternalServerError(
      'No business assigned! (889):update_business',
    );

  const sumOfTotals = invoices.reduce((accumulator, current) => {
    return accumulator + Number(current.total);
  }, 0);

  const buyerInfo = {
    taxID: `${invoices[0].clientCountryIso}${invoices[0].clientNif}`,
    name: invoices[0].clientName,
    address: {
      street: invoices[0].clientAddress,
      postalCode: invoices[0].clientPostalCode,
      town: invoices[0].clientCity,
      province: invoices[0].clientState,
      countryCode: 'ESP',
    },
    email: invoices[0].client.emailAddress,
    phone: invoices[0].client.contactPhone,
    centreCode: invoices[0].client.centreCode,
  };

  const convertedXml = {
    'facturae:Facturae': {
      '@xmlns:facturae': 'http://www.facturae.es/Facturae/2009/v3.2/Facturae',
      FileHeader: {
        SchemaVersion: '3.2',
        Modality: 'I', //all invoices, issued independently
        InvoiceIssuerType: 'EM', //issued by seller
        Batch: {
          BatchIdentifier: `${business.isoCode}${
            business.nif
          }-${moment().format('YYYY')}-${invoices[0].invoiceId}`,
          InvoicesCount: invoices.length,
          TotalInvoicesAmount: { TotalAmount: toFixed2(sumOfTotals) },
          TotalOutstandingAmount: { TotalAmount: toFixed2(sumOfTotals) },
          TotalExecutableAmount: { TotalAmount: toFixed2(sumOfTotals) },
          InvoiceCurrencyCode: invoices[0].moneyTypeCode,
        },
      },
      Parties: {
        SellerParty: {
          TaxIdentification: {
            PersonTypeCode:
              invoices[0].client.subscriberType.name === 'Empresa' ? 'J' : 'F',
            ResidenceTypeCode:
              invoices[0].client.subscriberType.name === 'Extranger'
                ? 'N'
                : 'R',
            TaxIdentificationNumber: `${business.isoCode}${business.nif}`,
          },
          LegalEntity: {
            CorporateName: business.name,
            AddressInSpain: {
              Address: business.address,
              PostCode: business.postalCode,
              Town: business.city,
              Province: business.state,
              CountryCode: 'ESP',
            },
            ContactDetails: {
              Telephone: business.phones
                ? String(business.phones).replace(/\s+/g, '')
                : undefined,
              ElectronicMail: business.email || undefined,
            },
          },
        },
        BuyerParty: {
          TaxIdentification: {
            PersonTypeCode:
              invoices[0].client.subscriberType.name === 'Empresa' ? 'J' : 'F',
            ResidenceTypeCode:
              invoices[0].client.subscriberType.name === 'Extranger'
                ? 'N'
                : 'R',
            TaxIdentificationNumber: buyerInfo.taxID,
          },
          AdministrativeCentres: {
            AdministrativeCentre: [
              {
                // Oficina contable
                CentreCode: buyerInfo.centreCode, // e.g. "I000000647"
                RoleTypeCode: '01',
                Name: buyerInfo.name,
                AddressInSpain: {
                  Address: buyerInfo.address.street,
                  PostCode: buyerInfo.address.postalCode,
                  Town: buyerInfo.address.town,
                  Province: buyerInfo.address.province,
                  CountryCode: 'ESP',
                },
              },
              {
                // Órgano gestor
                CentreCode: buyerInfo.centreCode,
                RoleTypeCode: '02',
                Name: buyerInfo.name,
                AddressInSpain: {
                  Address: buyerInfo.address.street,
                  PostCode: buyerInfo.address.postalCode,
                  Town: buyerInfo.address.town,
                  Province: buyerInfo.address.province,
                  CountryCode: 'ESP',
                },
              },
              {
                // Unidad tramitadora
                CentreCode: buyerInfo.centreCode,
                RoleTypeCode: '03',
                Name: buyerInfo.name,
                AddressInSpain: {
                  Address: buyerInfo.address.street,
                  PostCode: buyerInfo.address.postalCode,
                  Town: buyerInfo.address.town,
                  Province: buyerInfo.address.province,
                  CountryCode: 'ESP',
                },
              },
            ],
          },

          LegalEntity: {
            CorporateName: buyerInfo.name,
            AddressInSpain: {
              Address: buyerInfo.address.street,
              PostCode: buyerInfo.address.postalCode,
              Town: buyerInfo.address.town,
              Province: buyerInfo.address.province,
              CountryCode: 'ESP',
            },
            ContactDetails: {
              ...(buyerInfo.phone ? { Telephone: buyerInfo.phone } : {}),
              ...(buyerInfo.email ? { ElectronicMail: buyerInfo.email } : {}),
            },
          },
        },
      },
      Invoices: {
        Invoice: invoices.map((invoice: AnyModel) => ({
          InvoiceHeader: {
            InvoiceNumber: invoice.code,
            InvoiceDocumentType: invoice.code.startsWith('F') ? 'FC' : 'RC',
            InvoiceClass: 'OO', //type of invoice, included with tax
          },
          InvoiceIssueData: {
            IssueDate: moment(invoice.date).format('YYYY-MM-DD'),
            OperationDate: moment(invoice.date).format('YYYY-MM-DD'),
            InvoiceCurrencyCode: invoice.moneyTypeCode,
            TaxCurrencyCode: invoice.moneyTypeCode,
            LanguageName: invoice.client.language,
          },
          TaxesOutputs: {
            Tax: {
              TaxTypeCode: '01', //IVA
              TaxRate: '21.00',
              TaxableBase: { TotalAmount: toFixed2(invoice.baseTotal) },
              TaxAmount: { TotalAmount: toFixed2(invoice.taxesTotal) },
            },
          },
          InvoiceTotals: {
            TotalGrossAmount: toFixed2(invoice.baseTotal),
            TotalGeneralDiscounts: toFixed2(
              invoice.invoice_lines.reduce(
                (acc: number, cur: AnyModel) => acc + Number(cur.discountTotal),
                0,
              ),
            ),
            TotalGrossAmountBeforeTaxes: toFixed2(invoice.baseTotal),
            TotalTaxOutputs: toFixed2(invoice.taxesTotal),
            TotalTaxesWithheld: '0.00',
            InvoiceTotal: toFixed2(invoice.total),
            TotalFinancialExpenses: '0.00',
            TotalOutstandingAmount: toFixed2(invoice.total),
            TotalPaymentsOnAccount: '0.00',
            TotalExecutableAmount: toFixed2(invoice.total),
          },
          Items: {
            InvoiceLine: invoice.invoice_lines.map((invoice_line: AnyModel) => {
              const days = Number(
                JSON.parse(invoice_line.refererData ?? '{}').days ?? 1,
              );

              return {
                ItemDescription: invoice_line.description,

                Quantity: Number.isFinite(days) ? days.toFixed(6) : '1.000000',

                UnitOfMeasure: normalizeUnitOfMeasure(invoice_line.units),

                UnitPriceWithoutTax: toFixed6(invoice_line.unitPrice),
                TotalCost: toFixed6(invoice_line.subTotal),
                GrossAmount: toFixed6(invoice_line.subTotal),

                TaxesOutputs: {
                  Tax: {
                    TaxTypeCode: '01',
                    TaxRate: '21.00',
                    TaxableBase: {
                      TotalAmount: toFixed2(invoice_line.subTotal),
                    },
                    TaxAmount: { TotalAmount: toFixed2(invoice_line.taxTotal) },
                  },
                },
              };
            }),
          },
          PaymentDetails: {
            Installment: invoice.payments.map((payment: AnyModel) => ({
              InstallmentDueDate: moment(payment.dueDate).format('YYYY-MM-DD'),
              InstallmentAmount: toFixed2(payment.quantity),
              PaymentMeans: '04',
              AccountToBeCredited: {
                IBAN:
                  invoice.control_row?.invoice_profile?.iban ??
                  invoice.client.iban,
                BIC:
                  invoice.control_row?.invoice_profile?.bic ??
                  invoice.client.bic,
              },
            })),
          },
          AdditionalData: {
            InvoiceAdditionalInformation: {},
          },
        })),
      },
    },
  };

  const xml = create({ encoding: 'UTF-8' }, convertedXml).end({
    prettyPrint: true,
    headless: true,
  });

  const buffer = Buffer.from(xml, 'utf-8');

  return { data: buffer, filename: `invoices.xml` };
};

const convertFloatPartFrom01To00 = (number: number) => {
  if (typeof number !== 'number' || isNaN(number))
    throw new Error('Invalid input. Please provide a valid number.');

  let numberStr = number.toString();

  if (numberStr.endsWith('.01')) {
    numberStr = numberStr.slice(0, -2) + '00';
    return parseFloat(numberStr);
  }

  return number;
};

export const setAsPaidForNonRemittance = async (
  invoiceId: number,
  userId: number,
) => {
  const invoice = await GfInvoiceInvoice.findByPk(invoiceId, {
    include: [{ model: InvoicePaymentType, as: 'payment_type' }],
  });
  if (!invoice)
    throw new errors.NotFound(`invoice with id ${invoiceId} not found`);

  if (invoice.state !== 'issued')
    throw new errors.NotFound(`invalid invoice state`);

  if (invoice.payment_type?.name === 'Ramesa')
    throw new errors.BadRequest(`wrong payment type`);

  if (invoice.payd !== 'pending')
    throw new errors.BadRequest(`wrong payment status`);

  const shop = await Warehouse.findOne();
  assert(shop, `shop not found`);
  await setAsPaidPaymentOfInvoice(invoiceId, userId, shop.id);

  return 'invoice paid successfully';
};

export const tmpFixContracts = async (userId: number) => {
  const clientWithLemonContractIds = (
    await GfContract.findAll({
      where: { '$activeFee.cellProviderId$': 2 }, //lemon contracts
      include: [{ model: GfActiveFee, as: 'activeFee' }],
      group: ['clientId'],
    })
  ).map((contract) => contract.clientId);

  //find all clients control rows in this period to throwback and revert them
  const controlRowsToFix = await GfInvoiceControl.findAll({
    include: [
      {
        model: InvoiceClientsInvoiceProfile,
        as: 'invoice_profile',
        required: false,
      },
      {
        model: GfInvoicePeriod,
        as: 'period',
        required: false,
      },
      {
        model: GfClient,
        as: 'client',
        include: [
          {
            model: InvoiceClient,
            as: 'invoiceClient',
            include: [
              {
                model: InvoiceClientsInvoiceProfile,
                as: 'invoice_profiles',
                required: false,
              },
            ],
          },
        ],
      },
    ],
    where: { clientId: clientWithLemonContractIds, periodId: 76 },
  });

  //revert them
  for (const controlRowToFix of controlRowsToFix) {
    await getGfInvoiceControlsThrowbackId(controlRowToFix.id, userId);
  }

  //invoice them again
  for (const controlRowToFix of controlRowsToFix) {
    await getGfInvoiceControlsInvoicedId(controlRowToFix.id, userId);
  }

  return 'all done.';
};

export const tmpFixInvalidInvoiceCodes = async () => {
  const invalidControlRowsWithInvoice = await GfInvoiceControl.findAll({
    where: {
      periodId: 76,
      '$invoice.serieId$': 12,
      '$invoice.state$': 'issued',
    },
    include: [
      {
        model: GfInvoiceInvoice,
        as: 'invoice',
      },
    ],
  });
  console.log(
    `number of invalid invoices:${invalidControlRowsWithInvoice.length}`,
  );

  const invoiceNumera = await InvoiceNumera.findOne({
    where: {
      type: 'invoice',
      serieId: 13,
    },
  });
  assert(invoiceNumera, 'numera not found');

  let number = invoiceNumera.value;
  console.log(`current amount of numera is: ${invoiceNumera.value}`);

  const bulkUpdateInvoice: {
    id: number;
    code: string;
    invoiceId: number;
    serieId: number;
  }[] = [];
  const bulkUpdateControl: { id: number; issuedNumber: string }[] = [];
  for (const invalidControlRowWithInvoice of invalidControlRowsWithInvoice) {
    const num = ++number;
    const code = buildCode('F25', num);
    bulkUpdateInvoice.push({
      id: invalidControlRowWithInvoice.invoiceId,
      code,
      invoiceId: num,
      serieId: 13,
    });

    bulkUpdateControl.push({
      id: invalidControlRowWithInvoice.id,
      issuedNumber: code,
    });
  }

  await GfInvoiceInvoice.bulkCreate(bulkUpdateInvoice, {
    updateOnDuplicate: ['code', 'invoiceId', 'serieId'],
  });
  await GfInvoiceControl.bulkCreate(bulkUpdateControl, {
    updateOnDuplicate: ['issuedNumber'],
  });

  console.log(`final amount of numera is: ${invoiceNumera.value}`);
  invoiceNumera.value = number;
  await invoiceNumera.save();

  return 'all done.';
};
