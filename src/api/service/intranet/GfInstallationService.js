// @ts-check
'use strict';

const {
  intranet: {
    GfContractDataInternet,
    GfContract,
    GfClient,
    InvoiceClient,
    GfContractDataFix,
    GfContractDataTv,
    GfFeeGroup,
    GfFee,
    CrTask,
  },
} = require('@models');

const { findAllEntities } = require('@utils/request-handler');

const GeoGoufoneService = require('./GeoGoufoneService');
const { respondSuccessWithPagination } = require('@utils/response');

const last = (arr) => arr[arr.length - 1];
const getInternetTech = (row) =>
  last(row.contract.fee_group.gf_fees).internetTechnology;

const makeRefererTrace = (row) =>
  `installation/${getInternetTech(row)}_${row.contractId}_INTERNET`;

const lookupCrmEvents = async (rows) => {
  /** @type {Record<string, any>} */
  const events = {};

  for (const row of rows) {
    const key = makeRefererTrace(row);
    events[key] = null;
  }

  const foundEvents = await CrTask.findAll({
    where: {
      refererTrace: Object.keys(events),
    },
  });

  for (const event of foundEvents) {
    const key = event.refererTrace;
    events[key] = event;
  }

  return events;
};

exports.getAllInstallation = async function (query, userId) {
  const { size, page } = query;

  const entities = await findAllEntities(query, GfContractDataInternet, null, [
    {
      model: GfContract,
      as: 'contract',
      required: true,
      where: {
        state: 'pendingSectionsReady',
      },
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          required: true,
          include: [
            {
              model: GfFee,
              as: 'gf_fees',
              required: true,
            },
          ],
        },
        {
          model: GfClient,
          as: 'client',
          include: [
            {
              model: InvoiceClient,
              as: 'invoiceClient',
            },
          ],
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
        },
        {
          model: GfContractDataTv,
          as: 'dataTv',
          required: false,
        },
      ],
    },
  ]);

  const events = await lookupCrmEvents(entities.rows);
  const rows = entities.rows.map((row) => {
    const address = GeoGoufoneService.getFormatedAddress(row, true);
    const key = makeRefererTrace(row);

    return {
      ...row.get({ plain: true }),
      address,
      event: events[key],
    };
  });

  return respondSuccessWithPagination(
    rows,
    entities.count,
    size,
    page,
    query.url,
  );
};
