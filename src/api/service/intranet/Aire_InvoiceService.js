'use strict';

const { GfInvoicePeriod, GfAireInvoiceLine } = require('@models').intranet;
const { respondBadRequest, respondSuccess } = require('@utils/response');

const moment = require('moment');

const CounterService = require('../global/CounterService');

const { AireInvoiceLine } = require('./AireService');
const actionRunner = require('@lib/action-runner').default;
const to = require('await-to-js').default;

const airePageSize = 50;

/**
 * generate aire invoice line
 * @param {object} period related period for generate aire invoice line
 * @param {number} creator_id id of user than run this action
 * @param {boolean} force in pending mode or error, force param can execute again actions
 * @returns {{success:boolean,reason:string}}
 */
exports.consolideInvoiceLines = async (period, creator_id, force = false) => {
  if (period.aireResumenDownloaded === 'in_progress') {
    return respondSuccess({
      code: 'request_in_process',
      message: 'build aire invoice line is in progress',
    });
  }

  if (
    ![null, '', 'pending', 'error'].includes(period.aireResumenDownloaded) &&
    !force
  ) {
    return respondBadRequest({
      code: 'request_in_process',
      message: `status of aire lines for this period are ${period.aireResumenDownloaded}`,
    });
  }

  //delete aire invoice lines if exist
  await GfAireInvoiceLine.destroy({
    where: {
      periodId: period.id,
      providerCode: 'aire',
    },
  });

  //get year and month based on period for get aire data
  const momentPeriod = moment(period.period)
    .startOf('month')
    .subtract(1, 'month');

  const [error, invoiceLinesCount] = await to(
    AireInvoiceLine.count({
      mes: momentPeriod.format('MM'),
      anyo: momentPeriod.format('YYYY'),
    }),
  );

  if (error) {
    period.aireResumenDownloaded = 'error';
    await period.save();
    throw error;
  }

  const total = invoiceLinesCount ?? 0;
  const tandas = Math.ceil(total / airePageSize);

  // nothing to action
  if (tandas === 0) {
    return { success: true, reason: 'nothing to factor' };
  }

  //chage status to in_progress to generate lines
  period.aireResumenDownloaded = 'in_progress';
  await period.save();

  //init coutner
  await CounterService.create(`GfPreparativesAire_${period.id}`, {
    max: tandas,
  });

  //add action
  const actions = [];
  for (let n = 0; n < tandas; n++) {
    actions.push({
      name: 'aire-consolide-tanda',
      params: {
        periodId: period.id,
        tandas,
        page: n + 1,
        month: momentPeriod.format('MM'),
        year: momentPeriod.year(),
      },
    });
  }
  await actionRunner.createBulk(
    {
      creator_id,
      name: 'aire-consolide-tanda',
      model_name: 'gf_invoice_periods:consolideAire',
      model_id: period.id,
      params: {
        fetchActions: 20,
      },
    },
    actions,
  );

  return respondSuccess({
    code: 'request_started',
    message: 'import aire factor started',
  });
};

/**
 * generate invoice line based on input params: pagination for group invoice lines, year
 *      and month for related period, periodId for update status of period and tandas(all per pagination)
 * @param {{periodId:number,month:number,year:number,page:number,tandas:number}}
 * @returns {{success:boolean,params:{periodId:number,month:number,year:number,page:number,tandas:number}}}
 */
exports._consolideTanda = async ({ periodId, month, year, page, tandas }) => {
  const period = await GfInvoicePeriod.findByPk(periodId);
  try {
    const result = await AireInvoiceLine.paginated(
      {
        page,
        pageSize: airePageSize,
      },
      {
        mes: month,
        anyo: year,
      },
    );

    //normalize to insert data in GfAireInvoiceLine table
    const gfAireInvoiceLines = [];
    for (const element of result.rows ?? []) {
      gfAireInvoiceLines.push({
        providerCode: 'aire',
        fiscalId: element.fiscalId,
        number: element.telefono,
        month,
        year,
        data: JSON.stringify(element),
        periodId,
      });
    }
    await GfAireInvoiceLine.bulkCreate(gfAireInvoiceLines);
    await CounterService.tick(`GfPreparativesAire_${periodId}`);
    // is it's the last page
    const counter = await CounterService.getCounter(
      `GfPreparativesAire_${periodId}`,
    );
    if (
      counter.max === counter.value &&
      period.aireResumenDownloaded !== 'error'
    ) {
      period.aireResumenDownloaded = 'done';
      await period.save();
    }
  } catch (error) {
    console.log(error);
    period.aireResumenDownloaded = 'error';
    await period.save();
    throw new Error(error);
  }

  return {
    success: true,
    params: {
      periodId,
      month,
      year,
      page,
      tandas,
    },
  };
};
