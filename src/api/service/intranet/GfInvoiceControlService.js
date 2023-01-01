'use strict';

const {
  GfInvoiceControl,
  GfClient,
  InvoiceClientsInvoiceProfile,
  InvoiceClient,
  GfInvoicePeriod,
} = require('@models').intranet;

const {
  getAllEntities,
  findAndGet,
  findAndDeleteIntranet,
  findAndUpdate,
} = require('@utils/request-handler');

const GfInvoicePeriodService = require('./GfInvoicePeriodService');

const {
  respondCreated,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

/**
 *
 * delete a gf invoice control record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfInvoiceControlsId = async function (id) {
  return await findAndDeleteIntranet(id, GfInvoiceControl);
};

/**
 * Your GET endpoint
 * get all  gfinvoice control record
 *
 * returns Object
 **/
exports.getGfInvoiceControls = async function (query) {
  return await getAllEntities(query, GfInvoiceControl, undefined, [
    { model: GfClient, as: 'client' },
  ]);
};

/**
 * Your GET endpoint
 * get single invoice control record by id
 *
 * id String
 * returns Object
 **/
exports.getGfInvoiceControlsId = async function (id) {
  return await findAndGet(id, GfInvoiceControl);
};

/**
 *
 * save  gf invoice control of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postGfInvoiceControls = async function (body) {
  return respondCreated(await GfInvoiceControl.create(body));
};

/**
 *
 * update a   gf invoice control record by id
 *
 * id String
 * returns Object
 **/
exports.putGfInvoiceControlsId = async function (id, body) {
  return await findAndUpdate(id, body, GfInvoiceControl);
};

exports.getGfInvoiceControlsThrowbackId = async function (id, userId) {
  const control = await GfInvoiceControl.findByPk(id);
  if (!control)
    return respondNotFound(`invoice control with id ${id} not found`);

  await GfInvoicePeriodService.throwBack({
    disableReplica: false,
    controlRowId: id,
    first: false,
    last: false,
    control: false,
    userId,
  });

  return respondSuccess('throwback completed');
};

exports.getGfInvoiceControlsInvoicedId = async function (id, userId) {
  const control = await GfInvoiceControl.findByPk(id, {
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
            include: {
              model: InvoiceClientsInvoiceProfile,
              as: 'invoice_profiles',
              required: false,
            },
          },
        ],
      },
    ],
  });

  if (!control)
    return respondNotFound(`invoice control with id ${id} not found`);

  const result = await GfInvoicePeriodService.generateSingleInvoiceInQueue(
    control,
    control.period,
    userId,
    true,
  );
  const {
    invoiceControl,
    payments,
    lines,
    invoice,
    cellInvoiceLines: cellInvoiceLinesOfClient,
    key,
    gfInvoiceLines: gfLines,
    discountChanges,
  } = result;
  await invoiceControl.save();
  const matrix = {
    [key]: { invoiceControl, payments, lines, discountChanges },
  };
  const invoicesWithKeys = await GfInvoicePeriodService.insertInvoices([
    invoice,
  ]);
  await GfInvoicePeriodService.insertInvoiceLines(matrix, invoicesWithKeys);
  await GfInvoicePeriodService.insertPayments(matrix, invoicesWithKeys);
  await GfInvoicePeriodService.insertGfInvoiceLines(gfLines);
  await GfInvoicePeriodService.insertAndUpdateDiscounts(matrix);
  await GfInvoicePeriodService.insertCellInvoiceLines(cellInvoiceLinesOfClient);
  await GfInvoicePeriodService.updateInvoiceControl(matrix, invoicesWithKeys);

  return respondSuccess(invoiceControl);
};
