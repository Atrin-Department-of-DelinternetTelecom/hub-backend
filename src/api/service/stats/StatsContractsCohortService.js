'use strict';

const knex = require('@lib/knex').intranet;
const { respondSuccess, respondNotFound } = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');
const { getServiceInfo } = require('./utils');

const MONTH = (v, { as } = {}) =>
  as ? knex.raw(`MONTH(${v}) as ${as}`) : knex.raw(`MONTH(${v})`);

const fees = knex('gf_fees')
  .groupBy('gf_fees.feeGroupId')
  .where({ 'gf_fees.status': 1 })
  .as('gf_fees');

exports.getContractsCohortChart = async ({ year, service: _service }) => {
  const { service, internetTechnology } = getServiceInfo(_service);
  const startDate = moment(year.toString());
  let endDate = moment(year.toString()).endOf('year');

  if (endDate.isAfter(moment())) {
    endDate = moment();
  }

  const nMonths = endDate.diff(startDate, 'month') + 1;

  const dateRange = [
    startDate.format('YYYY-MM-DD'),
    endDate.format('YYYY-MM-DD'),
  ];

  const cohortsSize = await contractBaseQuery({ service, internetTechnology })
    .select(MONTH('dateActivation', { as: 'month' }))
    .count('*', { as: 'count' })
    .whereBetween('dateActivation', dateRange)
    .groupBy(MONTH('dateActivation'))
    .orderBy(MONTH('dateActivation'));

  const totalSize = cohortsSize.reduce((acc, curr) => acc + curr.count, 0);

  if (totalSize === 0) {
    return respondNotFound('Not enough data');
  }

  const chartData = await contractBaseQuery({ service, internetTechnology })
    .select(
      MONTH('dateActivation', { as: 'cohort' }),
      knex.raw('MONTH(dateDeactivation) - MONTH(dateActivation) as month'),
    )
    .count('*', { as: 'size' })
    .whereBetween('dateActivation', dateRange)
    .whereBetween('dateDeactivation', dateRange)
    .whereRaw('dateDeactivation > dateActivation')
    .groupByRaw(`MONTH(dateActivation), MONTH(dateDeactivation)`)
    .orderByRaw(`MONTH(dateActivation), MONTH(dateDeactivation)`);

  const cohorts = [];
  // iterate over chart cells
  for (
    let cohortNumber = startDate.month() + 1;
    cohortNumber <= nMonths;
    cohortNumber++
  ) {
    const months = [];
    const totalSize = _.find(cohortsSize, { month: cohortNumber })?.count ?? 0;
    let currentSize = totalSize;

    const push = (dec) => {
      currentSize = currentSize - dec;
      months.push({
        size: currentSize,
        diff: -1 * dec,
        percent: (currentSize / totalSize) * 100,
      });
    };

    for (let month = 0; month <= nMonths - cohortNumber; month++) {
      const monthSize =
        _.find(chartData, { cohort: cohortNumber, month })?.size ?? 0;
      push(monthSize);
    }

    cohorts.push({
      size: totalSize,
      label: startDate
        .clone()
        .set('month', cohortNumber - 1)
        .format('MMMM'),
      months,
    });
  }

  const summery = [];
  for (let i = 0; i < nMonths; i++) {
    const monthSummeryData = cohorts
      .map((cohort) => cohort.months[i])
      .filter((item) => !!item && !Number.isNaN(item.percent));

    const avg =
      monthSummeryData.reduce((acc, val) => acc + val.percent, 0) /
      monthSummeryData.length;

    summery.push({ avg });
  }

  return respondSuccess({
    total: totalSize,
    months: nMonths,
    cohorts,
    summery,
  });
};

const contractBaseQuery = ({ service, internetTechnology }) => {
  const query = knex('gf_contracts')
    .innerJoin('gf_fee_groups', {
      'gf_contracts.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .innerJoin(fees, { 'gf_fee_groups.id': 'gf_fees.feeGroupId' })
    .where({
      'gf_contracts.uid': config.get('index.intranet.uid'),
      'gf_sections.uid': config.get('index.intranet.uid'),
      'gf_feegroups_sections_xref.status': 1,
    });

  if (service) {
    query.where({
      'gf_sections.code': service,
    });
  }

  if (internetTechnology) {
    query.where({
      'gf_fees.internetTechnology': internetTechnology,
    });
  }

  return query;
};
