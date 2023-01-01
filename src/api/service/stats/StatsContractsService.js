'use strict';

const knex = require('@lib/knex').intranet;
const { respondSuccess, respondBadRequest } = require('@utils/response');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');
const { getAllEntities } = require('@utils/request-handler');
const {
  intranet: { GfContract, GfContractDataInternet, GfFeeGroup, GfSection },
} = require('@models');

const { Op } = require('sequelize');

const { buildChart, accumulate } = require('@utils/knex/chart');

const fees = knex('gf_fees')
  .groupBy('gf_fees.feeGroupId')
  .where({ 'gf_fees.status': 1 })
  .as('gf_fees');

const contractBaseQuery = () => {
  return knex('gf_contracts')
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
      'gf_contracts.status': 1,
      'gf_contracts.state': 'active',
      'gf_fee_groups.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    });
};

exports.getContractsTotalStats = async function () {
  const stats = await contractBaseQuery()
    .select(
      knex.raw(
        'IF(gf_fees.internetTechnology, gf_fees.internetTechnology, LOWER(gf_sections.code)) as service',
      ),
    )
    .count('gf_contracts.id', { as: 'count' })
    .groupBy('service');

  const result = Object.fromEntries(
    stats.map((row) => [row.service, row.count]),
  );

  return respondSuccess(result);
};

exports.getContractsChart = async function ({
  startDate,
  endDate,
  step,
  accumulated,
}) {
  step = step ?? 'month';
  accumulated = accumulated === 'true';

  const stats = contractBaseQuery().select(
    knex.raw(
      'IF(gf_fees.internetTechnology, gf_fees.internetTechnology, LOWER(gf_sections.code)) as prop',
    ),
    'gf_contracts.dateActivation as date',
  );

  const chart = await buildChart({
    sql: stats,
    startDate: moment(startDate),
    endDate: moment(endDate),
    stepSize: step,
    dateColumn: 'gf_contracts.dateActivation',
    keys: ['radio', 'fibra', 'cell', 'fix', 'tv'],
  });

  if (accumulated) {
    // this function will mutate the chart
    accumulate(chart);
  }

  return respondSuccess(chart);
};

exports.contractsWithUnusedCpeDevice = async function (query) {
  if (typeof query.include === 'boolean') {
    return respondBadRequest('you should not send include query param');
  }

  return getAllEntities(
    query,
    GfContract,
    {
      state: 'pendingSectionsReady',
    },
    [
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: true,
        where: {
          [Op.and]: [
            {
              cpeSn: { [Op.ne]: '' },
            },
            {
              cpeSn: { [Op.ne]: null },
            },
          ],
        },
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
    ],
  );
};

exports.contractsWithUnfinishedInstallation = async function (query) {
  if (typeof query.include === 'boolean') {
    return respondBadRequest('you should not send include query param');
  }

  return getAllEntities(
    query,
    GfContract,
    {
      state: 'pendingSectionsReady',
    },
    [
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: true,
        where: {
          installationDone: 0,
          instalationDate: {
            [Op.or]: [
              {
                [Op.lt]: moment().format('YYYY-MM-DD'),
              },
              {
                [Op.eq]: null,
              },
            ],
          },
        },
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
    ],
  );
};

exports.contractsWithDiscount = async function (query) {
  return getAllEntities(
    query,
    GfContract,
    {
      percentageDiscount: {
        [Op.or]: {
          [Op.eq]: 0,
          [Op.is]: null,
        },
      },
    },
    [
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: false,
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
    ],
  );
};
