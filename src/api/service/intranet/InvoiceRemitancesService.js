'use strict';

const {
  InvoiceRemitances,
  InvoicePayment,
  InvoiceBanksData,
  sequelize,
  InvoiceMoneyTypes,
  InvoiceRemitanceLog,
  InvoiceClient,
  GfInvoiceInvoice,
  InvoiceRemitanceHistory,
  transaction,
  GfClient,
  GfInvoiceControl,
  InvoiceClientsInvoiceProfile,
} = require('@models').intranet;

const { getBucket } = require('@lib/minIO');

const { MoozaicGlobalBusiness } = require('@models').moozaic;

const { SepaSDD } = require('./SepaSDD');

const CounterService = require('../global/CounterService');

const { getAllEntities } = require('@utils/request-handler');

const IBANTool = require('iban');

const {
  respondBadRequest,
  respondSuccess,
  respondNotFound,
  respondCreated,
  respondOK,
} = require('@utils/response');

const moment = require('moment');

const config = require('@config');

const remittanceBucket = config.get('index.minIoBuckets.remittance');
const remittanceBucketName = new URL(
  config.get('index.minIoBuckets.remittance'),
).pathname.replace('/', '');

const { Op } = require('sequelize');

const {
  getMoozaicShipmentPaymentType,
} = require('@service/intranet/PaymentService');

const {
  restorePaymentsShipmentState,
} = require('@service/intranet/InvoicePaymentService');

const _ = require('lodash');

const actionRunner = require('@lib/action-runner').default;

const { create } = require('xmlbuilder2');
const { consolidePayments } = require('./InvoiceInvoiceService');

const to = require('await-to-js').default;

const getRemesableTotals = async (fromDate = null) => {
  const typeId = (await getMoozaicShipmentPaymentType()).id;
  fromDate = fromDate
    ? fromDate
    : moment().startOf('month').subtract(3, 'month').format('YYYY-MM-DD');

  return InvoicePayment.findAll({
    attributes: [
      'dueDate',
      [sequelize.fn('count', '*'), 'num'],
      [sequelize.fn('sum', sequelize.col('quantity')), 'total'],
      [sequelize.fn('IFNULL', sequelize.col('remitanceId'), 0), 'remitanceId'],
      'state',
    ],
    include: [
      {
        model: InvoiceRemitances,
        as: 'invoice_remitance',
        required: false,
        where: {
          id: { $col: 'InvoicePayment.remitanceId' },
        },
        attributes: [
          ['state', 'remitanceState'],
          ['total', 'remitanceTotal'],
        ],
      },
    ],
    where: {
      paymentType: typeId,
      status: 1,
      dueDate: {
        [Op.gte]: fromDate,
      },
    },
    group: [
      'dueDate',
      'state',
      sequelize.fn('IFNULL', sequelize.col('remitanceId'), 0),
    ],
    order: [['dueDate', 'DESC']],
  });
};

exports.getGlobalAbstract = async () => {
  const totals = await getRemesableTotals();
  const normalizedTotals = _.groupBy(totals, 'state');
  for (const state in normalizedTotals) {
    normalizedTotals[state] = _.groupBy(
      normalizedTotals[state],
      'dueDateFormatted',
    );
  }

  if ('due' in normalizedTotals) {
    const dueDates = [];
    for (const k in normalizedTotals.due) {
      const paymentOfSelectedDay = normalizedTotals.due[k];
      if (paymentOfSelectedDay.length > 1) {
        return {
          success: false,
          reason:
            'More than one due block for one date, wrong remitance id assigned!!',
        };
      }
      dueDates.push(
        moment(paymentOfSelectedDay[0].dueDate).format('YYYY-MM-DD'),
      );
    }
    const AllRemitance = await getAllRemitanceByDueDates(dueDates);
    for (const k in normalizedTotals.due) {
      const paymentOfSelectedDay = normalizedTotals.due[k][0]?.get({
        plain: true,
      });
      paymentOfSelectedDay.remitances =
        AllRemitance[
          moment(paymentOfSelectedDay.dueDate).format('YYYY-MM-DD')
        ] ?? [];
      delete paymentOfSelectedDay.remitanceId;
      delete paymentOfSelectedDay.invoice_remitance;
      normalizedTotals.due[k] = paymentOfSelectedDay;
    }
  }

  return respondSuccess(normalizedTotals);
};

const getAllRemitanceByDueDates = async (dueDates) => {
  const AllRemitance = {};
  (
    await InvoiceRemitances.findAll({
      where: {
        date: dueDates,
      },
      include: { model: InvoiceBanksData, as: 'bank' },
      attributes: {
        include: [
          [
            sequelize.literal(`
      (SELECT COUNT(*) FROM invoice_payments
       WHERE remitanceId = InvoiceRemitances.id and status = 1)
    `),
            'numberOfPayments',
          ],
        ],
      },
    })
  ).forEach((remitance) => {
    const dateKey = moment(remitance.date).format('YYYY-MM-DD');
    const remitances = AllRemitance[dateKey] ? AllRemitance[dateKey] : [];
    remitances.push(remitance);
    AllRemitance[dateKey] = remitances;
  });
  return AllRemitance;
};

const getAffectedPayments = async (remitance) => {
  if (remitance.confirmed == 1) {
    return {
      success: false,
      reason: 'Remitance confirmed!!',
    };
  }

  const remitanceType = await getMoozaicShipmentPaymentType();

  if (!remitanceType) {
    return {
      success: false,
      reason: 'Payment type remitance not found',
    };
  }

  const preventDuplicatePayment = {};

  let payments = (
    await InvoicePayment.findAll({
      where: {
        dueDate: remitance.date,
        state: 'due',
        paymentType: remitanceType.id,
      },
      include: {
        model: GfInvoiceInvoice,
        as: 'invoice',
        include: [
          {
            model: InvoiceClient,
            as: 'invoice_client',
            required: false,
          },
          { model: GfClient, as: 'client', required: false },
          {
            model: GfInvoiceControl,
            as: 'control_row',
            required: false,
            include: {
              model: InvoiceClientsInvoiceProfile,
              as: 'invoice_profile',
              required: false,
            },
          },
        ],
      },
      order: [['id', 'desc']],
    })
  ).filter((payment) => {
    if (preventDuplicatePayment[payment.id]) return false;
    preventDuplicatePayment[payment.id] = true;
    return true;
  });

  if (payments.length === 0)
    return {
      success: false,
      reason: 'No payments pending',
    };

  const size = remitance.limit;
  if (size > 0) {
    // we must chunk paymnets to max total limit
    const _pays = [];
    let total = 0;
    for (const payment of payments) {
      total += Number(payment.quantity);
      if (total > size) {
        continue;
      }
      _pays.push(payment);
    }
    payments = _pays;
  }

  return {
    success: true,
    payments,
  };
};

exports.generateFile = async function (remitanceId, userId) {
  const remitance = await InvoiceRemitances.findByPk(remitanceId, {
    include: {
      model: InvoiceBanksData,
      as: 'bank',
      required: false,
      include: { model: InvoiceMoneyTypes, as: 'money_type', required: false },
    },
  });
  remitance.state = 'generating';
  await remitance.save();
  // MooWSManager::fire("server_InvoiceRemitances", "updated", $me);

  let endPayment = {
    type: 'FRST',
    collection_date: moment(remitance.date).format('YYYY-MM-DD'),
  };
  // throw new Error("No compatible contract state");
  const [error, result] = await to(
    transaction(async () => {
      if (!remitance.bank) throw new Error('invalid bankId');

      if (!remitance.bank.money_type?.code)
        throw new Error('No money code found');

      const business = await MoozaicGlobalBusiness.findOne({
        where: {
          uid: config.get('index.intranet.uid'),
        },
      });

      if (!business?.name) {
        throw new Error('No business name found');
      }

      await restorePaymentsShipmentState(remitanceId);

      const result = await getAffectedPayments(remitance);
      if (!result.success) {
        throw new Error('No payments found');
      }

      const payments = result.payments;

      const sepaConfig = {
        name: remitance.bank.businessName,
        IBAN: remitance.bank.iban,
        batch: true,
        creditor_id: remitance.bank.creditorId,
        currency: remitance.bank.money_type.code,
        version: '2',
      };

      const sepaSDD = new SepaSDD(sepaConfig);
      const isValidConfig = await sepaSDD.isValidConfig();
      if (isValidConfig !== true) {
        remitance.state = 'error';
        await remitance.save();
        throw new Error(`Invalid config file: ${isValidConfig}`);
      }

      await CounterService.create(`remitance_${remitanceId}`, {
        max: payments.length,
      });
      await CounterService.create(`remitance_errors_${remitanceId}`, {
        max: payments.length,
      });

      let n = 0;
      const errors = [];
      let total = 0;
      const payIds = [];

      await InvoiceRemitanceLog.update(
        { status: 0 },
        {
          where: { remitanceId },
        },
      );

      const refreshIntervalId = setInterval(
        () => sendCounterToWS(remitanceId),
        1000,
      );

      const updatePays = [];
      for (let k = 0; k < payments.length; k++) {
        await CounterService.tick(`remitance_${remitanceId}`, 1, false);
        const pay = payments[k];
        const toRemount = Number(pay.quantity);
        if (toRemount <= 0) {
          await InvoiceRemitanceLog.create({
            remitanceId: remitanceId,
            type: 'discard',
            reason: 'Total is 0€',
            paymentId: pay.id,
            metadata: JSON.stringify({ pay }),
          });
          continue;
        }

        if (
          pay.invoice &&
          !['issued', 'rectifictive', 'canceled'].includes(pay.invoice.state)
        ) {
          errors.push({
            type: 'invoiceState',
            client: pay.invoice.clientName,
          });
          await InvoiceRemitanceLog.create({
            remitanceId: remitanceId,
            type: 'error',
            reason: `Inapropiate invoice state (${pay.invoice.state})`,
            paymentId: pay.id,
            metadata: JSON.stringify({ pay, invoice: pay.invoice }),
          });
          await CounterService.tick(`remitance_errors_${remitanceId}`);
          continue;
        }

        const { IBAN, BIC } = getBankInfo(pay);
        if (!IBAN) {
          errors.push({
            type: 'noIban',
            client: pay.invoice.clientName,
          });

          await InvoiceRemitanceLog.create({
            remitanceId: remitanceId,
            type: 'error',
            reason: 'User without valid IBAN',
            paymentId: pay.id,
            metadata: JSON.stringify({ pay, invoice: pay.invoice }),
          });
          await CounterService.tick(`remitance_errors_${remitanceId}`);
          continue;
        }

        const payment = {
          name: pay.invoice.clientName,
          IBAN,
          ...(BIC ? { BIC } : {}),
          amount: toRemount.toFixed(2),
          type: 'FRST',
          collection_date: moment(pay.dueDate).format('YYYY-MM-DD'),
          mandate_id: pay.invoice.id + ':' + pay.invoice.code + ':' + pay.id,
          mandate_date: moment(pay.invoice.date).format('YYYY-MM-DD'),
          description: business.name + ' factura ' + pay.invoice.code,
          invoice_client: pay.invoice.invoice_client,
        };

        try {
          sepaSDD.addPayment(payment);
          total += toRemount;
          payIds.push(pay.id);
          updatePays.push({ id: pay.id, state: 'shiped', remitanceId });
          await pay.save();
          n++;
        } catch (err) {
          errors.push({
            type: 'addPayment',
            client: pay.invoice_client,
            invoice: pay.invoice,
            sepaPay: payment,
            reason: err.message,
          });

          await InvoiceRemitanceLog.create({
            remitanceId: remitanceId,
            type: 'error',
            reason: 'Error SEPA: ' + err.message,
            paymentId: pay.id,
            metadata: JSON.stringify({
              pay,
              invoice: pay.invoice,
              sepaPay: payment,
            }),
          });
          await CounterService.tick(`remitance_errors_${remitanceId}`);
        }

        endPayment = payment;
      }

      clearInterval(refreshIntervalId);
      sendCounterToWS(remitanceId);

      //update all state and reimtance id of payment instances
      await InvoicePayment.bulkCreate(updatePays, {
        updateOnDuplicate: ['remitanceId', 'state', 'updateDate'],
      });
      if (!(n > 0)) {
        remitance.state = 'pending';
        await remitance.save();
        return respondSuccess('Nothing to make a shipment');
      }

      // get xml object and convert to string of xml
      const xmlContent = sepaSDD.sepagenerateFile(endPayment);
      const xml = create({ encoding: 'UTF-8' }, xmlContent).end({
        prettyPrint: true,
      });

      const filename = `remitance-${moment().format('YYYYMMDDHHmmss')}-${moment(
        remitance.date,
      ).format('YYYY-MM-DD')}-${remitance.bank.alias}.xml`;

      const minioClient = await getBucket(remittanceBucket);
      await minioClient.putObject(
        remittanceBucketName,
        filename,
        Buffer.from(xml, 'utf-8'),
      );

      //save address of new file related to remitance
      remitance.hubFile = filename;
      remitance.state = 'shiped';
      remitance.total = parseFloat(total).toFixed(2);
      await remitance.save();

      await InvoiceRemitanceHistory.create({
        remitanceId,
        action: 'downloaded',
        metadata: JSON.stringify({
          filte: remitance.file,
          total,
          config: sepaConfig,
          payIds: JSON.stringify(payIds),
        }),
        userId,
      });

      return respondSuccess('xml file generated');
    }),
  );

  if (error) {
    console.log(error);
    remitance.state = 'pending';
    await remitance.save();
    return respondBadRequest('error generate remitance');
  }

  return result;
};

const sendCounterToWS = async (remitanceId) => {
  const counter = await CounterService.getCounter(`remitance_${remitanceId}`);
  CounterService.emitChange(counter);
};

exports.setConfirmed = async function (remitanceId, creator_id) {
  const remitance = await InvoiceRemitances.findByPk(remitanceId);
  if (!remitance) respondNotFound(`remitacne with id ${remitanceId} not found`);

  const paymentIds = (
    await InvoicePayment.findAll({
      where: {
        remitanceId: remitanceId,
        state: 'shiped',
      },
      attributes: ['id'],
    })
  ).map((e) => {
    return e.id;
  });

  const groups = _.chunk(paymentIds, 25);
  if (groups.length == 0) {
    return respondBadRequest('Nothing to confirm');
  }

  remitance.state = 'set_as_paids';
  await remitance.save();

  await CounterService.create(`remitance_confirmed_${remitanceId}`, {
    max: paymentIds.length,
  });

  const actions = groups.map((group, i) => {
    return {
      name: 'payment-set-confirmed',
      params: {
        remitanceId,
        paymentIds: group,
      },
    };
  });

  await actionRunner.createBulk(
    {
      creator_id,
      name: 'payment-set-confirmed',
    },
    actions,
  );

  return respondSuccess({ success: true });
};

/**
 * Your GET endpoint
 * create new FeeGroup label record
 *
 * returns Object
 **/
exports.createInvoiceRemitance = async function (body, userId) {
  body.state = 'pending';
  if (!body.name) {
    body.name = 'remitance ' + moment(body.date).format('DD / MM / YYYY');
  }

  const bank = body.bankId
    ? await InvoiceBanksData.findByPk(body.bankId)
    : await InvoiceBanksData.findOne({ where: { default: 1 } });

  if (!bank) return respondBadRequest(`bank not found`);
  body.bankId = bank.id;

  const newRemittance = await InvoiceRemitances.create(body);
  await InvoiceRemitanceHistory.create({
    remitanceId: newRemittance.id,
    action: 'create',
    metadata: JSON.stringify(body),
    userId,
  });

  const remittance = await InvoiceRemitances.findByPk(newRemittance.id, {
    include: {
      model: InvoiceBanksData,
      as: 'bank',
      attributes: ['id', 'alias'],
    },
  });
  return respondCreated(remittance);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getInvoiceRemitances = async function (query) {
  let customWhere = undefined;
  const withErrorQuery = query.search?.whereQuery?.withError;
  if (withErrorQuery) {
    customWhere =
      query.search.whereQuery.withError === '0'
        ? {
            id: {
              [Op.notIn]: (
                await InvoiceRemitances.findAll({
                  where: { '$errors.id$': { [Op.gt]: 0 } },
                  include: {
                    model: InvoiceRemitanceLog,
                    as: 'errors',
                    attributes: ['id'],
                    required: false,
                  },
                })
              ).map((remitance) => remitance.id),
            },
          }
        : { '$errors.id$': { [Op.gt]: 0 } };
    delete query.search.whereQuery.withError;
  }
  return getAllEntities(
    query,
    InvoiceRemitances,
    customWhere,
    [
      {
        model: InvoiceBanksData,
        as: 'bank',
        required: false,
        attributes: ['id', 'alias'],
      },
      {
        model: InvoiceRemitanceLog,
        as: 'errors',
        attributes: ['id'],
        required: false,
      },
    ],
    {
      attributes: {
        include: [
          [
            sequelize.literal(`
    (SELECT COUNT(*) FROM invoice_payments
     WHERE remitanceId = InvoiceRemitances.id and status = 1)
  `),
            'numberOfPayments',
          ],
          [
            sequelize.literal(`
    (SELECT COUNT(*) FROM invoice_remitance_log
     WHERE remitanceId = InvoiceRemitances.id and status = 1)
  `),
            'withError',
          ],
        ],
      },
    },
  );
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceRemitanceById = async function (id) {
  //find remitance
  let remitance = await InvoiceRemitances.findByPk(id, {
    where: { id },
    include: [
      {
        model: InvoiceBanksData,
        as: 'bank',
        required: false,
        attributes: ['id', 'alias'],
      },
    ],
    attributes: {
      include: [
        [
          sequelize.literal(`
(SELECT COUNT(*) FROM invoice_remitance_log
WHERE remitanceId = InvoiceRemitances.id and status = 1)
`),
          'withError',
        ],
      ],
    },
  });
  if (!remitance) return respondNotFound(`remitance with id ${id} not found`);
  remitance = remitance.get({ plain: true });

  //attach extra info related to this remitance
  remitance.totalAbs = await getPaymentsInformationRelatedToRemitance(
    remitance,
  );

  return respondSuccess(remitance);
};

/**
 * get pending,included,same date remitanced and same date pending payments related to remitance and date of remitance
 * @param {objcet} remitance related remitance information
 * @returns {Promise<object>}
 */
const getPaymentsInformationRelatedToRemitance = async (remitance) => {
  const date = moment(remitance.date).format('YYYY-MM-DD');
  const sameDateRemitance = InvoicePayment.count({
    where: {
      dueDate: date,
      paymentType: (await getMoozaicShipmentPaymentType()).id,
    },
  });

  const sameDatePanding = InvoicePayment.count({
    where: {
      dueDate: date,
      state: 'due',
    },
  });

  const included = InvoicePayment.count({
    where: {
      remitanceId: remitance.id,
    },
  });
  const sameDate = InvoicePayment.count({
    where: { dueDate: date },
  });

  const result = await Promise.all([
    sameDate,
    sameDateRemitance,
    sameDatePanding,
    included,
  ]);
  return Object.fromEntries(
    _.zip(
      ['sameDate', 'sameDateRemitance', 'sameDatePanding', 'included'],
      result,
    ),
  );
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateInvoiceRemitance = async function (id, body, userId) {
  const remitance = await InvoiceRemitances.findByPk(id);
  if (!remitance) respondNotFound(`remitance with id ${id} not found`);

  const errors = [];
  if (['shiped', 'confirmed'].includes(remitance.state)) {
    ['bankId', 'limit', 'date'].forEach((element) => {
      if (body[element] != remitance[element]) {
        errors.push(
          `You cannot modify ${element} while remitance is ${body.state}`,
        );
      }
    });
  }

  if (errors.length > 0) {
    return respondBadRequest(errors);
  }

  if (body.bankId) {
    const bank = await InvoiceBanksData.findByPk(body.bankId);
    if (!bank)
      return respondBadRequest(`bank with id ${body.bankId} not found`);
  }

  if (remitance.state !== 'shiped' && body.state === 'shiped') {
    body.dateGenerated = moment().format('YYYY-M-D H:m:s');
  }

  await remitance.update(body);
  await InvoiceRemitanceHistory.create({
    remitanceId: remitance.id,
    action: 'updated',
    metadata: JSON.stringify(body),
    userId,
  });
  return respondSuccess(remitance);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteInvoiceRemitance = async function (id, userId) {
  const remitance = await InvoiceRemitances.findByPk(id);

  if (!remitance) respondNotFound(`remittance with id ${id} not found`);

  if (!['pending', 'error'].includes(remitance.state)) {
    return respondBadRequest('Inapropiate remitance state');
  }

  remitance.status = 0;
  await remitance.save();

  await InvoiceRemitanceHistory.create({
    remitanceId: id,
    action: 'deleted',
    userId,
  });

  return respondSuccess('remittance successfully deleted.');
};

const getBankInfo = (payment) => {
  const clientIban = (payment.invoice?.client?.iban ?? '').trim();
  const profileIban = (
    payment.invoice?.control_row?.invoice_profile?.iban ?? ''
  ).trim();

  return {
    IBAN: IBANTool.electronicFormat(profileIban || clientIban),
    BIC: profileIban
      ? payment.invoice?.control_row?.invoice_profile?.bic ?? ''
      : payment.invoice?.client?.bic,
  };
};

exports.fixUnsettedRemittance = async (remitanceId) => {
  const remittance = await InvoiceRemitances.findByPk(remitanceId);
  if (!remittance) {
    throw new Error('remittance not found');
  }

  const payments = await InvoicePayment.findAll({
    where: {
      remitanceId,
    },
  });

  for (const payment of payments) await consolidePayments(payment.invoiceId);

  return respondOK('done');
};
