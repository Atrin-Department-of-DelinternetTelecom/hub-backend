'use strict';

const {
  intranet: {
    GfInvoicePeriod,
    GfInvoiceControl,
    InvoiceClientsInvoiceProfile,
    GfClient,
    InvoiceClient,
    GfInvoiceInvoice,
    GfAireInvoiceLine,
    InvoiceNumera,
    InvoicePayment,
    InvoiceLine,
    GfInvoiceLine,
    GfDiscountsScheduled,
    GfDiscountsHistory,
  },
  system: { Bulk },
} = require('@models');

const {
  getAllEntities,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const {
  respondCreated,
  respondNotFound,
  respondBadRequest,
  respondSuccess,
  respondInternalServerError,
} = require('@utils/response');

const _ = require('lodash');

const config = require('@config');

const knex = require('@lib/knex').intranet;

const actionRunner = require('@lib/action-runner').default;
const FixCDR_GfTmpKamailioInvoiceService = require('./FixCDR_GfTmpKamailioInvoiceService');
const Invoice_GfInvoiceControlService = require('./Invoice_GfInvoiceControlService');
const Aire_InvoiceService = require('./Aire_InvoiceService');
const Invoice_ThrowBack_GfInvoiceService = require(`./Invoice_ThrowBack_GfInvoiceService`);
const CounterService = require('../global/CounterService');
const FacadeCell = require('./FacadeCell');
const GfInvoiceService = require('./GfInvoiceService');
const PaymentService = require('./PaymentService');
const Invoice_GfClientInvoiceService = require('./Invoice_GfClientInvoiceService');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const InvoiceProductService = require('./InvoiceProductService');
const GfFeeService = require('./Fee/GfFeeService');
const to = require('await-to-js').default;
const OptimizedGlobalCounterService = require('../global/OptimizedGlobalCounterService');
const moment = require('moment');
const { Op } = require('sequelize');
const { AireInvoiceLine } = require('./AireService');
const { getDefaultSerie, buildCode } = require('./NumeraService');

/**
 *
 * delete a gf invoice period record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfInvoicePeriodsId = async function (id) {
  return findAndDeleteIntranet(id, GfInvoicePeriod);
};

/**
 * Your GET endpoint
 * get all  gfinvoice period record
 *
 * returns Object
 **/
exports.getGfInvoicePeriods = async function (query) {
  return getAllEntities(query, GfInvoicePeriod);
};

/**
 * Your GET endpoint
 * get single invoice period record by id
 *
 * id String
 * returns Object
 **/
exports.getGfInvoicePeriodsId = async function (id) {
  return findAndGet(id, GfInvoicePeriod);
};

/**
 *
 * save  gf invoice period of an employee
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postGfInvoicePeriods = async function (body) {
  return respondCreated(
    await GfInvoicePeriod.create(body).catch((err) => console.log(err)),
  );
};

/**
 *
 * update a   gf invoice period record by id
 *
 * id String
 * returns Object
 **/
exports.putGfInvoicePeriodsId = async function (id, body) {
  return findAndUpdate(id, body, GfInvoicePeriod);
};

/**
 * start invoicing system (init preparative)
 * @param {number} period_id id of period that we want execute related actions
 * @param {string} single select init prepariative on which service(aire,fix or ...) and execute all if single is null
 */
exports.initPreparatives = async (period_id, single, creator_id) => {
  try {
    // check invoice period id valid or no
    const invoicePeriod = await GfInvoicePeriod.findByPk(period_id);
    if (!invoicePeriod) {
      // TODO(erfan): refactor to Error
      // eslint-disable-next-line no-throw-literal
      throw {
        code: 404,
        message: `invoice period with id ${period_id} not found`,
      };
    }

    // execute initpreparative base on params (execute all or one of them)
    if (!single || single === 'aire') {
      return Aire_InvoiceService.consolideInvoiceLines(
        invoicePeriod,
        creator_id,
        single === 'aire',
      );
    }

    if (!single || single === 'edges') {
      return FixCDR_GfTmpKamailioInvoiceService.setEdgesByTandas(
        invoicePeriod,
        creator_id,
      );
    }

    if (!single || single === 'controlrows') {
      // build controls
      return buildControls(invoicePeriod, creator_id);
    }
  } catch (error) {
    return errorResponse(error);
  }
};

/**
 * create valid response based on type and code of error
 * @param {Object} error reported error
 */
const errorResponse = (error) => {
  if (error.code) {
    switch (error.code) {
      case 404:
        return respondNotFound(error.message);
      case 400:
        return respondBadRequest(error.message);
      default:
        return respondInternalServerError(error.message);
    }
  }
  return respondInternalServerError(error);
};

/**
 * start create control rows for each valid client by queues
 * @param {object} period period information
 * @param {number} creator_id creator of tandas
 * @param {boolean} as_comparative
 * @returns {Promise<{success:boolean,reason:string}>}
 */
const buildControls = async (period, creator_id, as_comparative = false) => {
  // check if status is valid, then continue
  if (![null, '', 'pending', 'error', 'done'].includes(period.controlRows)) {
    return respondSuccess({
      code: 'request_in_process',
      message: `this period control row is ${period.controlRows}.`,
    });
  }

  //remove previos controls related to this period
  await GfInvoiceControl.destroy({
    where: { periodId: period.id },
  });

  //queues(actions) creating here
  Invoice_GfInvoiceControlService.buildControlTandas(
    period,
    creator_id,
    as_comparative,
  );

  return respondSuccess({
    code: 'request_started',
    message: `start creating control rows`,
  });
};

let controlRowsByClientId = {};

/**
 *
 * @param {object} period period model for update and get info to do set invoice
 * @param {number} creator_id id of user that want create invoice queue
 * @returns {Promise<{success:boolean,reason?:string}>}
 */
const _createInvoiceCueues = async (period, creator_id, intranet_user_id) => {
  //check is it possible to create queues or no
  const canDo = _checkCanDo('invoice', period);
  if (!canDo.success) {
    return respondSuccess(canDo);
  }

  const allControlsNoInvoiced = await GfInvoiceControl.findAll({
    where: {
      periodId: period.id,
      [Op.or]: [{ invoiceId: 0 }, { invoiceId: { [Op.is]: null } }],
    },
    include: [
      {
        model: InvoiceClientsInvoiceProfile,
        as: 'invoice_profile',
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

  const allControls = await GfInvoiceControl.count({
    where: {
      periodId: period.id,
    },
  });

  // if there is no control to invoice return and dont create new queus for invoice control rows
  if (!allControlsNoInvoiced.length) {
    period.invoicesState = 'done';
    await period.save();
    return respondSuccess({
      code: 'nothing_to_invoice',
      success: true,
    });
  }

  period.invoicesState = 'in_progress';
  await period.save();

  // init global counter
  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_' + period.id,
    {
      max: allControls,
      init: allControls - allControlsNoInvoiced.length,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_errors_' + period.id,
    {
      max: allControls,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  const allAireInvoiceLine = await GfAireInvoiceLine.count({
    where: { periodId: period.id, state: { [Op.is]: null } },
  });
  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_aire_invocie_line_' + period.id,
    {
      max: allAireInvoiceLine,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_invoice_cueued_' + period.id,
    {
      max: allControlsNoInvoiced.length,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  const chunks = _.chunk(
    allControlsNoInvoiced,
    config.get('index.invoice.concurrentExecuteInvoiceAction'),
  );

  controlRowsByClientId = _.groupBy(allControlsNoInvoiced, 'clientId');

  (async () => {
    console.log('-------------------------- --------------------------');
    console.time(`Invoice generation init time:`);
    await initDataForInvoiceProcess(period);
    console.timeEnd(`Invoice generation init time:`);
    console.log('-------------------------- --------------------------');
    counter = 0;

    console.time('Total generation time is:');
    console.log(
      'Invoice generation started by chunck: ' +
        config.get('index.invoice.concurrentExecuteInvoiceAction'),
    );
    console.log('-------------------------- --------------------------');
    // OPERATION
    let loop = 1;
    for (const chunk of chunks) {
      console.log(
        `chunk ${loop} started by ` +
          Object.keys(chunk).length +
          ' items and memory usage (MB):',
        process.memoryUsage().heapUsed / 1024 / 1024,
      );
      console.log('-------------------------- --------------------------');
      console.time(`chunk ${loop} finished at:`);
      await executeControlRows(chunk, period, intranet_user_id);
      console.timeEnd(`chunk ${loop} finished at:`);
      console.log('-------------------------- --------------------------');
      loop += 1;
    }
    await executeControlRows(retryDeadLocks, period, intranet_user_id);
    await doControl(period);
    period.invoicesState = 'done';
    await period.save();
    console.log('------ *** ------ (: :)------ *** ------');
    console.timeEnd('Total generation time is:');
    console.log('------ *** ------ (: :)------ *** ------');
  })();

  return respondSuccess({
    code: 'request_started',
    success: true,
  });
};

const retryDeadLocks = [];

const executeControlRows = async (rows, period, userId) => {
  if (!rows.length) return;
  const results = await Promise.allSettled(
    rows.map((invoiceControl) => {
      return exports.generateSingleInvoiceInQueue(
        invoiceControl,
        period,
        userId,
      );
    }),
  );
  const invoiceInvoices = [];
  const gfInvoiceLines = [];
  const cellInvoiceLines = [];
  const matrix = {};
  results.forEach((result) => {
    const {
      invoiceControl,
      payments,
      lines,
      invoice,
      cellInvoiceLines: cellInvoiceLinesOfClient,
      key,
      gfInvoiceLines: gfLines,
      discountChanges,
    } = result.value;
    matrix[key] = { invoiceControl };
    if (Object.keys(invoice).length !== 0) {
      if (cellInvoiceLinesOfClient.length)
        cellInvoiceLines.push(...cellInvoiceLinesOfClient);
      invoiceInvoices.push(invoice);
      gfInvoiceLines.push(...gfLines);
      matrix[key] = { ...matrix[key], payments, lines, discountChanges };
    }
  });
  const invoicesWithKeys = await exports.insertInvoices(invoiceInvoices);
  await exports.insertGfInvoiceLines(gfInvoiceLines);
  await exports.insertAndUpdateDiscounts(matrix);
  await exports.insertCellInvoiceLines(cellInvoiceLines);
  await exports.insertInvoiceLines(matrix, invoicesWithKeys);
  await exports.insertPayments(matrix, invoicesWithKeys);
  await exports.updateInvoiceControl(matrix, invoicesWithKeys);

  await doControl(period);
};

exports.insertAndUpdateDiscounts = async (matrix) => {
  const newScheduled = [];
  const updateScheduled = [];
  const histories = [];
  Object.keys(matrix).forEach((key) => {
    const { discountChanges } = matrix[key];

    if (discountChanges?.histories)
      histories.push(...discountChanges.histories);
    if (discountChanges?.newScheduled)
      newScheduled.push(...discountChanges.newScheduled);
    if (discountChanges?.updateScheduled)
      updateScheduled.push(...discountChanges.updateScheduled);
  });

  const newDiscountIds = await insertDiscountAndRplaceId(newScheduled);
  await updateDiscounts(updateScheduled);
  await insertDiscountHistories(histories, newDiscountIds);
};

const insertDiscountAndRplaceId = async (newScheduled) => {
  const insertedDiscount = {};
  (
    await GfDiscountsScheduled.bulkCreate(
      newScheduled.map((discount) => {
        const { id, ...restorOfObject } = discount;
        return restorOfObject;
      }),
      {
        returning: true,
      },
    )
  ).forEach((discount, index) => {
    insertedDiscount[newScheduled[index].id] = discount.id;
  });

  return insertedDiscount;
};

const updateDiscounts = async (updateScheduled) => {
  await GfDiscountsScheduled.bulkCreate(updateScheduled, {
    updateOnDuplicate: [
      'contractId',
      'matrixId',
      'executedId',
      'permanentParentId',
      'date',
      'description',
      'permanent',
      'discount',
      'discountType',
      'type',
      'state',
      'fromScheduleId',
      'tpvCode',
      'trace',
      'keyGroup',
    ],
  });
};

const insertDiscountHistories = async (histories, newDiscountIds) => {
  await GfDiscountsHistory.bulkCreate(
    histories.map((history) => ({
      ...history,
      scheduledId: newDiscountIds[history.scheduledId] ?? history.scheduledId,
    })),
  );
};

exports.insertCellInvoiceLines = async (cellInvoiceLines) => {
  await GfAireInvoiceLine.bulkCreate(
    (cellInvoiceLines ?? []).map((cellInvoiceLine) => ({
      id: cellInvoiceLine.id,
      state: cellInvoiceLine.state,
      contractId: cellInvoiceLine.contractId,
      invoiceClientId: cellInvoiceLine.invoiceClientId,
      controlRowId: cellInvoiceLine.controlRowId,
    })),
    {
      updateOnDuplicate: [
        'id',
        'state',
        'contractId',
        'invoiceClientId',
        'controlRowId',
      ],
    },
  );
};

exports.updateInvoiceControl = async (matrix, invoiceIds) => {
  const control_rows = Object.values(matrix).reduce(
    (acc, { invoiceControl }) => {
      acc.push({
        ...invoiceControl.get({ plain: true }),
        invoiceId:
          invoiceControl.invoiceId !== -1
            ? invoiceIds[buildKeyByInvoiceControl(invoiceControl)]
            : -1,
      });
      return acc;
    },
    [],
  );

  await GfInvoiceControl.bulkCreate(control_rows, {
    updateOnDuplicate: [
      'invoiceId',
      'total',
      'baseTotal',
      'taxsTotal',
      'emailSent',
      'emailId',
      'sorryEmailSent',
      'payDate',
      'periodDate',
      'issued',
      'issuedNumber',
      'remounted',
      'qRemounted',
      'mustRemount',
      'isRegularized',
      'withError',
      'mustReview',
      'errorDescription',
      'errorPhase',
      'cueued',
      'cueuedIssued',
      'cueuedEmail',
      'updateDate',
    ],
  });
};

export const buildKeyByInvoiceControl = (invoiceControl) => {
  return `[gfClient:${invoiceControl.clientId}],[periodId:${invoiceControl.periodId}],[profileId:${invoiceControl.invoiceProfileId}]`;
};

exports.insertInvoices = async (invoices) => {
  const insertedInvoice = {};
  (
    await GfInvoiceInvoice.bulkCreate(invoices, {
      returning: true,
    })
  ).forEach((invoice) => {
    insertedInvoice[invoice.refererKey] = invoice.id;
  });

  return insertedInvoice;
};

exports.insertInvoiceLines = async (matrix, invoiceIds) => {
  const filledInvoiceLines = [];
  for (const key in matrix) {
    const invoiceId = invoiceIds[key];
    const lines = matrix[key]?.lines ?? [];
    for (const invoiceLine of lines) {
      invoiceLine.invoiceId = invoiceId;
      filledInvoiceLines.push(invoiceLine);
    }
  }

  await InvoiceLine.bulkCreate(filledInvoiceLines);
};

exports.insertGfInvoiceLines = async (gfInvoiceLines) => {
  await GfInvoiceLine.bulkCreate(gfInvoiceLines);
};

/**
 * prepare all static data need from database
 */
const initDataForInvoiceProcess = async (period) => {
  await FacadeCell.initAllBunuses(true);
  await FacadeCell.initAllCellProviderFees(true);
  await GfInvoiceService.initAllBono(true);
  await PaymentService.initPeriodType(true);
  await PaymentService.initInvoicePaymentType(true);
  await PaymentService.getMoozaicOnlinPaymentType(true);
  await PaymentService.getMoozaicCashPaymentType(true);
  await PaymentService.getMoozaicShipmentPaymentType(true);
  await PaymentService.getMoozaicBankTransferPaymentType(true);
  await GfContractSectionStatusService.getAllCached(true);
  await InvoiceProductService.getIndexedInvoiceProducts('code', true);
  await GfFeeService.getPrice(0, true);
  await Invoice_GfClientInvoiceService.cachedInvolvedContracts(true, period);
  await GfInvoiceService.getIva(true);
  await GfInvoiceService.cahchedChargeFix(period);
  await GfInvoiceService.cahchedChargeLemon(period);
};

/**
 * throwback a controll row (called in queue and update period entity by condition)
 * @param {{
 *  disableReplica: boolean,
 *  first: boolean,
 *  last: boolean,
 *  control: boolean,
 *  controlRowId: number
 * }} params
 */
exports._throwBackInvoiceCue = async ({
  controlRowId,
  disableReplica,
  first,
  last,
  control,
  userId = 0,
}) => {
  await exports.throwBack({
    disableReplica,
    controlRowId,
    first,
    last,
    control,
    userId,
  });

  return respondSuccess({
    success: true,
  });
};

/**
 *
 * @param {object} period period information for update state of issue
 * @param {number} creator_id id of creator of actions
 * @returns
 */
const _createIssueCueues = async (period, creator_id) => {
  //check for pussible actions to do
  const canDo = _checkCanDo('issue', period);
  if (!canDo.success) {
    return respondSuccess(canDo);
  }

  await Invoice_GfInvoiceControlService.clearErrors(period, 'issued');

  // find control rows that invoiced and not issued
  const notIssuedControls = await GfInvoiceControl.findAll({
    where: {
      periodId: period.id,
      invoiceId: {
        [Op.gt]: 0,
      },
      issued: 0,
    },
  });

  // count issued control
  const alreadyIssuedControl = await GfInvoiceControl.count({
    where: {
      periodId: period.id,
      invoiceId: {
        [Op.gt]: 0,
      },
      issued: 1,
    },
  });

  const totalInvoicedControl = notIssuedControls.length + alreadyIssuedControl;
  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_issued_errors_' + period.id,
    {
      max: totalInvoicedControl,
      init: 0,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_issued_' + period.id,
    {
      max: notIssuedControls.length,
      init: alreadyIssuedControl,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  // all invoiced, isuued it means issued state is done
  if (totalInvoicedControl === alreadyIssuedControl) {
    period.issuedState = 'done';
    await period.save();
    return respondSuccess('nothing to issue');
  }

  //there is no invoiced control, it means state is pending(we can not start when until control row invoiced)
  if (!notIssuedControls.length) {
    period.issuedState = 'pending';
    await period.save();
    return respondSuccess('nothing to issue');
  }

  // start to issue invoices
  period.issuedState = 'in_progress';
  await period.save();

  const actions = notIssuedControls.map((notIssuedControl, i) => ({
    name: 'issue-invoice-control-row',
    params: {
      controlId: notIssuedControl.id,
      first: i === 0,
      last: i === notIssuedControls.length - 1,
      control: (i + 1) % 200 === 0,
      periodId: period.id,
    },
  }));

  await actionRunner.createBulk(
    {
      creator_id,
      name: 'issue-invoice-control-row',
      model_name: 'gf_invoice_periods:issueInvoiceControlRow',
      model_id: period.id,
      params: {
        fetchActions: 200,
      },
    },
    actions,
  );

  return respondSuccess({
    code: 'request_started',
    success: true,
  });
};

exports.invoiceControlRowsIndexedById = {};

/**
 * throwback invoiced action
 * @param {object} period model for get information about period and update some state
 * @param {number} creator_id id of user that create queues
 * @returns {Promise<{success:boolean,reason?:string}>}
 */
const _createThrowBackCueues = async (period, creator_id) => {
  const canDo = _checkCanDo('throwback', period);
  if (!canDo.success) {
    return respondSuccess(canDo);
  }

  await Invoice_GfInvoiceControlService.clearErrors(period, 'invoiced');

  const invoiced = await GfInvoiceControl.findAll({
    where: {
      periodId: period.id,
      invoiceId: {
        [Op.ne]: 0,
      },
    },
    include: [
      { model: GfInvoicePeriod, as: 'period' },
      { model: GfInvoiceInvoice, as: 'invoice', required: false },
    ],
  });
  invoiced.forEach((invoicedControlRow) => {
    exports.invoiceControlRowsIndexedById[invoicedControlRow.id] =
      invoicedControlRow;
  });

  if (!invoiced.length) {
    period.invoicesState = 'pending';
    await period.save();
    return respondSuccess({
      code: 'nothing_to_throwback',
      success: true,
    });
  }

  period.invoicesState = 'in_progress';
  await period.save();

  const actions = invoiced.map((invoicedControl, i) => ({
    name: 'throwback-invoiced-control-row',
    params: {
      controlRowId: invoicedControl.id,
      simpleCounter: true,
      disableReplica: true,
      periodId: period.id,
      first: i === 0,
      last: i === invoiced.length - 1,
      control: (i + 1) % 10 === 0,
      userId: creator_id,
    },
  }));

  await actionRunner.createBulk(
    {
      creator_id,
      name: 'throwback-invoiced-control-row',
      model_name: 'gf_invoice_periods:throwbackInvoiceControlRow',
      model_id: period.id,
      params: {
        fetchActions: 200,
      },
    },
    actions,
  );

  return respondSuccess({
    code: 'request_started',
    success: true,
  });
};

const _createEmailCueues = async (period, creator_id) => {
  const canDo = _checkCanDo('email', period);

  if (!canDo.success) return respondSuccess(canDo);

  await Invoice_GfInvoiceControlService.clearErrors(period, 'email');

  const issuedControlsToSendMail = await GfInvoiceControl.findAll({
    where: {
      periodId: period.id,
      invoiceId: {
        [Op.gt]: 0,
      },
      issued: 1,
      emailSent: 0,
      '$invoice.client.emailAddress$': {
        [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }],
      },
      '$invoice.client.sendInvoiceMail$': 1,
    },
    include: [
      {
        model: GfInvoiceInvoice,
        as: 'invoice',
        include: [{ model: GfClient, as: 'client' }],
      },
    ],
  });

  const allreadySent = await GfInvoiceControl.count({
    where: {
      periodId: period.id,
      invoiceId: {
        [Op.gt]: 0,
      },
      issued: 1,
      emailSent: 1,
    },
  });

  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_mail_' + period.id,
    {
      max: issuedControlsToSendMail.length,
      init: allreadySent,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  await CounterService.create(
    'Invoice_GfPeriodsManager_progress_mail_errors_' + period.id,
    {
      max: issuedControlsToSendMail.length,
      init: 0,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  if (issuedControlsToSendMail.length === allreadySent) {
    period.emailsState = 'done';
    await period.save();
    return respondSuccess('nothing to email');
  }

  if (!issuedControlsToSendMail.length) {
    period.emailsState = 'pending';
    await period.save();
    return respondSuccess('nothing to issue');
  }

  const actions = issuedControlsToSendMail.map(
    (issuedControlToSendMail, i) => ({
      name: 'email-invoice-control-row',
      params: {
        controlId: issuedControlToSendMail.id,
        first: i === 0,
        last: i === issuedControlsToSendMail.length - 1,
        control: (i + 1) % 200 === 0,
        periodId: period.id,
      },
    }),
  );

  period.emailsState = 'in_progress';
  await period.save();

  await actionRunner.createBulk(
    {
      creator_id,
      name: 'email-invoice-control-row',
      model_name: 'gf_invoice_periods:emailInvoiceControlRow',
      model_id: period.id,
      params: {
        fetchActions: 200,
      },
    },
    actions,
  );

  return respondSuccess({
    code: 'request_started',
    success: true,
  });
};

/**
 * create queues to execute tasks based on commands
 * @param {number} period_id related to which period
 * @param {string} phase create which queues or select which action based on phase
 * @param {number} creator_id user id of creator queue or action
 * @returns {Promise<{success:boolean,reason?:string}>}
 */
exports.createCueues = async (
  period_id,
  phase,
  creator_id,
  intranet_user_id,
) => {
  //find related period and check period is valid
  const period = await GfInvoicePeriod.findByPk(period_id);
  if (!period) {
    return respondNotFound(`period with id ${period_id} not found`);
  }

  //create queue based on command
  switch (phase) {
    case 'invoiced':
      return _createInvoiceCueues(period, creator_id, intranet_user_id);
    case 'throwBack':
      return _createThrowBackCueues(period, creator_id);
    case 'issued':
      return _createIssueCueues(period, creator_id);
    case 'stopInvoice':
      return stopInvoice(period, creator_id);
    case 'stopIssue':
      return stopIssue(period, creator_id);
    case 'emailSent': {
      return _createEmailCueues(period, creator_id);
    }
    default:
      return respondSuccess({
        success: false,
        reason: `incorrect phase name ${phase}`,
      });
  }
};

const resetCounters = async () => {};

const stopInvoice = async (period) => {};

const stopIssue = async (period) => {
  //check is it possible to create queues or no
  const canDo = _checkCanDo('stopIssue', period);
  if (!canDo.success) {
    return respondSuccess(canDo);
  }
  const issueBulk = await Bulk.findOne({
    where: {
      name: 'issue-invoice-control-row',
      status: 'running',
      model_id: period.id,
    },
  });
  if (issueBulk) {
    await actionRunner.pauseBulk(issueBulk.id);
    return respondSuccess(`issue process stoped`);
  }

  return respondSuccess(`there is no issue process to stop`);
};

const stopEmails = async () => {};

/**
 * check that could be possible to do specific action or no
 * @param {string} type action
 * @param {object} period period information
 * @returns {{success:boolean, message?:string , code:string}}
 */
const _checkCanDo = (type, period) => {
  switch (type) {
    case 'invoice':
    case 'throwback':
      if (
        !['prepared', 'in_progress', null].includes(period.state) ||
        !['pending', '', null].includes(period.issuedState) ||
        !['pending', 'done', '', null].includes(period.invoicesState)
      ) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state [state:${period.state},issuedState:${period.issuedState}]`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    case 'issue':
      if (
        period.state !== 'in_progress' ||
        period.invoicesState !== 'done' ||
        !['pending', 'done', '', null].includes(period.issuedState)
      ) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state [state:${period.state},issuedState:${period.issuedState},emailsState:${period.emailsState}]`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    case 'email':
      if (
        !['in_progress', 'done', '', null].includes(period.state) ||
        period.issuedState !== 'done' ||
        !['pending', 'done', '', null].includes(period.emailsState)
      ) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state [state:${period.state},issuedState:${period.issuedState}]`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    case 'stopInvoice':
      if (!['in_progress'].includes(period.invoicesState)) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    case 'stopIssue':
      if (!['in_progress'].includes(period.issuedState)) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    case 'stopEmails':
      if (!['in_progress'].includes(period.emailsState)) {
        return {
          code: 'request_error',
          success: false,
          message: `Inapropiated state`,
        };
      }
      return {
        code: 'request_started',
        success: true,
      };
    default:
      return {
        code: 'request_error',
        success: false,
        message: 'invalid type',
      };
  }
};

/**
 * get status of emails,invoiced and errors(in mail,invoice or issued) and count them and put data inside period
 * @param {object} period period model to get info and update
 * @returns {Promise<object>} period model
 */
export const consolideTotals = async (period) => {
  const totals = await getRealTotals(period);
  period.totals = JSON.stringify(totals);
  await period.save();
  return period;
};

/**
 * get all information about state of action in selected period based on Invoice controls(invoced,errors,email status and ...)
 * @param {object} period period information,
 * @return {Promise<{
 *  total: number,
 *  invoiced: number,
 *  effectiveInvoiced: number,
 *  issued: number,
 *  emailSent: number,
 *  percentageInvoiced: string,
 *  percentageIssued: string,
 *  percentageEmailSent: string,
 *  errors: number,
 *  errorsInvoice: number,
 *  errorsIssue: number,
 *  errorsEmailSent: number,
 *  cueued: number
 * }>}
 */
const getRealTotals = async (period) => {
  const whereQuery = { uid: 90, status: 1, periodId: period.id };
  const INVOICE_CONTROL_TABLE_NAME = 'gf_invoice_control';
  const totalQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'total' })
    .where(whereQuery)
    .first();

  const invoicedQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'invoiced' })
    .whereNot('invoiceId', 0)
    .where(whereQuery)
    .first();

  const effectiveInvoicedQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'effectiveInvoiced' })
    .where('invoiceId', '>', 0)
    .where(whereQuery)
    .first();

  const issuedQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'issued' })
    .where('issued', '>', 0)
    .where(whereQuery)
    .first();

  const emailSentQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'emailSent' })
    .where('emailSent', '>', 0)
    .where(whereQuery)
    .first();

  const errorsInvoiceQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'errorsInvoice' })
    .where({ withError: 1, errorPhase: 'invoiced' })
    .where(whereQuery)
    .first();

  const errorsIssueQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'errorsIssue' })
    .where({ withError: 1, errorPhase: 'issued' })
    .where(whereQuery)
    .first();

  const errorsEmailQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'errorsEmail' })
    .where({ withError: 1, errorPhase: 'emailSent' })
    .where(whereQuery)
    .first();

  const cueuedQuery = knex(INVOICE_CONTROL_TABLE_NAME)
    .count('id', { as: 'cueued' })
    .where({ cueued: 'cueued' })
    .where(whereQuery)
    .first();

  const results = (
    await Promise.all([
      totalQuery,
      invoicedQuery,
      effectiveInvoicedQuery,
      issuedQuery,
      emailSentQuery,
      errorsInvoiceQuery,
      errorsIssueQuery,
      errorsEmailQuery,
      cueuedQuery,
    ])
  ).map((query) => Object.values(query)[0]);

  const {
    total,
    invoiced,
    effectiveInvoiced,
    issued,
    emailSent,
    errorsInvoice,
    errorsIssue,
    errorsEmail,
    cueued,
  } = Object.fromEntries(
    _.zip(
      [
        'total',
        'invoiced',
        'effectiveInvoiced',
        'issued',
        'emailSent',
        'errorsInvoice',
        'errorsIssue',
        'errorsEmail',
        'cueued',
      ],
      results,
    ),
  );

  const eInvoiceTotal = total - errorsInvoice;
  const eIssuedTotal = effectiveInvoiced - errorsIssue;
  const eEmailTotal = eIssuedTotal - errorsEmail;

  let percentageInvoiced = (invoiced * 100) / eInvoiceTotal;
  percentageInvoiced =
    percentageInvoiced > 100 ? 100 : percentageInvoiced.toFixed(2);

  const percentageIssued = ((issued * 100) / eIssuedTotal).toFixed(2);
  const percentageEmailSent = ((emailSent * 100) / eEmailTotal).toFixed(2);

  return {
    total,
    invoiced,
    effectiveInvoiced,
    issued,
    emailSent,
    percentageInvoiced,
    percentageIssued,
    percentageEmailSent,
    errors: errorsInvoice + errorsIssue + errorsEmail,
    errorsInvoice,
    errorsIssue,
    errorsEmailSent: errorsEmail,
    cueued,
  };
};

/**
 * throwback a controll row (called in queue and update period entity by condition)
 * @param {{disableReplica:boolean,first:boolean,last:boolean,control:boolean,controlRowId:number}} params
 * @returns {Promise<{ success: boolean, reason?: string, control: object }>}
 */
exports.throwBack = async ({ controlRowId, first, last, control, userId }) => {
  let invoiceControl = exports.invoiceControlRowsIndexedById[controlRowId];
  if (!invoiceControl) {
    invoiceControl = await GfInvoiceControl.findByPk(controlRowId, {
      include: [
        { model: GfInvoicePeriod, as: 'period' },
        { model: GfInvoiceInvoice, as: 'invoice', required: false },
      ],
    });
  }
  const result = await Invoice_ThrowBack_GfInvoiceService.throwbackControlRow(
    invoiceControl,
    userId,
  );

  const period = invoiceControl.period;

  OptimizedGlobalCounterService.tick(
    `Invoice_GfPeriodsManager_progress_${period.id}`,
    -1,
  );

  if (last) {
    period.invoicesState = 'pending';
    await period.save();
    await consolideTotals(period);
  } else if (control || first) {
    await consolideTotals(period);
  }

  return result;
};

exports.aireFactorStatus = async (periodId) => {
  const period = await GfInvoicePeriod.findByPk(periodId);
  if (!period) return respondNotFound(`period with id ${periodId} not found`);

  const momentPeriod = moment(period.period)
    .startOf('month')
    .subtract(1, 'month');

  const [error, result] = await to(
    AireInvoiceLine.paginated(
      {
        page: 1,
        pageSize: 1,
      },
      {
        mes: momentPeriod.format('MM'),
        anyo: momentPeriod.format('YYYY'),
      },
    ),
  );

  return respondSuccess({
    success: !!result,
    data: result ?? error,
  });
};

let counter = 0;
exports.generateSingleInvoiceInQueue = async (
  invoiceControl,
  period,
  userId,
  comeFromControlRows = false,
) => {
  let payments = [];
  let lines = [];
  let gfInvoiceLines = [];
  let invoice = {};
  let cellInvoiceLines = null;
  let discountChanges = null;
  try {
    canQueStart(invoiceControl);
    const controlRowsOfClient = comeFromControlRows
      ? [invoiceControl]
      : controlRowsByClientId[invoiceControl.clientId];

    const result = await Invoice_GfClientInvoiceService.generateClientInvoice(
      controlRowsOfClient,
      invoiceControl.invoiceProfileId,
      userId,
      comeFromControlRows,
      period,
    );

    if (result) {
      if (!result.invoice) {
        invoiceControl.invoiceId = -1;
        invoiceControl.withError = 0;
        invoiceControl.errorDescription = `${invoiceControl.errorDescription}\nNothing to invoice`;
      }
      OptimizedGlobalCounterService.tick(
        `Invoice_GfPeriodsManager_progress_${period.id}`,
      );
    }

    invoiceControl.cueued = 'processed';
    payments = result.payments ?? [];
    lines = result.lines ?? [];
    invoice = result.invoice ?? {};
    gfInvoiceLines = result.gfInvoiceLines ?? [];
    cellInvoiceLines = result.cellInvoiceLines;
    discountChanges = result.discountChanges ?? null;
  } catch (error) {
    handleError(error.message, period, invoiceControl);
  }
  return {
    invoiceControl,
    payments,
    lines,
    invoice,
    gfInvoiceLines,
    key:
      invoice.refererKey ??
      `[gfClient:${invoiceControl.clientId}],[periodId:${period.id}],[profileId:${invoiceControl.invoiceProfileId}]`,
    cellInvoiceLines,
    discountChanges,
  };
};

/**
 * check that can queue start or no based on some ingnoring flag
 * @param {object} invoiceControl invoice control info
 * @param {object} ignoreState ignore state flage for queue start
 * @returns {Promise<{ success: boolean }>}
 */
const canQueStart = (invoiceControl, ignoreState = false) => {
  if (invoiceControl.withError) {
    invoiceControl.cueued = 'waiting';
  }
  invoiceControl.cueued = invoiceControl.cueued
    ? invoiceControl.cueued
    : 'waiting';

  if (!ignoreState && invoiceControl.cueued !== 'waiting') {
    throw Error(`inapropiate cueded state: ${invoiceControl.cueued}`);
  }

  invoiceControl.cueued = 'cueued';
  if (invoiceControl.cueued !== 'cueued') {
    throw Error(`bad queue state ${invoiceControl.cueued}`);
  }

  invoiceControl.cueued = 'processing';

  return {
    success: true,
    row: invoiceControl,
    periodId: invoiceControl.periodId,
    clientId: invoiceControl.clientId,
    profileId: invoiceControl.profileId,
  };
};

/**
 * update states in invoice period and calculate total status and put in period totals
 * @param {object} period period info for check is last data to update state
 * @param {boolean} first is this first control row or no
 * @param {boolean} last is this last control row or no
 * @param {boolean} control is flag trigger to true when we have 100 control to update data inside period
 */
const doControl = async (period, first, last, control) => {
  await consolideTotals(period);
};

/**
 * handle error in process of invocing for each control raw (update some field of control)
 * @param {object} error error reason
 * @param {object} period period information
 * @param {boolean} first is first control ?
 * @param {boolean} last is last control?
 * @param {boolean} control refresh some flag
 * @param {object} controlRow control row information to update
 * @returns {Promise<{success:boolean}>}
 */
const handleError = async (error, period, controlRow) => {
  controlRow.cueued = 'waiting';
  controlRow.errorPhase = 'invoiced';
  controlRow.withError = true;
  controlRow.errorDescription = `CUE:${error}\n${controlRow.errorDescription}`;
  if (
    error.includes('rollback has been') ||
    error.includes('Deadlock found') ||
    error.includes('Operation timeout')
  ) {
    controlRow.errorDescription = '';
    controlRow.errorPhase = null;
    retryDeadLocks.push(controlRow);
    throw new Error('retry');
  }

  OptimizedGlobalCounterService.tick(
    'Invoice_GfPeriodsManager_progress_errors_' + period.id,
  );
};

exports.insertPayments = async (matrix, invoiceIds) => {
  const serie = await getDefaultSerie('payment');
  const numberOfCode = await InvoiceNumera.findOne({
    where: {
      type: 'payment',
      serieId: serie.id,
    },
  });

  const payments = Object.values(matrix)
    .map(({ payments }) => payments)
    .filter((payment) => payment)
    .flat(1);

  let code = numberOfCode.value;
  numberOfCode.value = numberOfCode.value + payments.length;
  await numberOfCode.save();

  const paymentsWithCodeAndSerieId = payments.map((payment) => ({
    ...payment,
    code: buildCode(serie.prefix, code++),
    serieId: serie.id,
    invoiceId: invoiceIds[payment.refererKey],
  }));

  await InvoicePayment.bulkCreate(paymentsWithCodeAndSerieId);
};
