'use strict';

const knex = require('@lib/knex').intranet;
const config = require('@config');
const moment = require('moment');
const { getServiceInfo } = require('./utils');
const { respondSuccess } = require('@utils/response');
const { associateBy } = require('@utils/collections');
const _ = require('lodash');
const { getAllRows } = require('@utils/knex/table');

const fees = knex('gf_fees')
  .groupBy('gf_fees.feeGroupId')
  .where({ 'gf_fees.status': 1 })
  .as('gf_fees');

const invoiceLinesBaseQuery = ({ state, service, internetTechnology } = {}) => {
  // @ts-ignore
  const sql = knex('invoice_lines')
    .innerJoin('invoice_invoice', {
      'invoice_invoice.id': 'invoice_lines.invoiceId',
    })
    .innerJoin('invoice_products', {
      'invoice_lines.productId': 'invoice_products.id',
    })
    .innerJoin(
      'gf_contracts',
      'gf_contracts.id',
      '=',
      knex.raw('SUBSTRING(invoice_lines.refererKey, 12)'),
    )
    .innerJoin('gf_fee_groups', {
      'gf_contracts.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin(fees, { 'gf_fee_groups.id': 'gf_fees.feeGroupId' })
    .innerJoin('gf_feegroups_sections_xref', {
      'gf_feegroups_sections_xref.feeGroupId': 'gf_fee_groups.id',
    })
    .innerJoin('gf_sections', {
      'gf_sections.id': 'gf_feegroups_sections_xref.sectionId',
    })
    .where({
      'invoice_lines.uid': config.get('index.intranet.uid'),
      'invoice_lines.status': 1,
      'invoice_invoice.status': 1,
      'gf_fee_groups.uid': config.get('index.intranet.uid'),
      'gf_fee_groups.status': 1,
      'gf_feegroups_sections_xref.status': 1,
    });

  if (state) {
    sql.where({
      'invoice_invoice.state': state,
    });
  }

  if (service) {
    sql.where({
      'gf_sections.code': service,
    });
  }

  if (internetTechnology) {
    sql.where({
      'gf_fees.internetTechnology': internetTechnology,
    });
  }
  return sql;
};

exports.getInvoiceProductsSummary = async function (query) {
  const {
    service: _service,
    startDate: _startDate,
    endDate: _endDate,
    state,
  } = query;
  const startDate = moment(_startDate);
  const endDate = moment(_endDate);

  const { service, internetTechnology } = getServiceInfo(_service);

  const [result] = await invoiceLinesBaseQuery({
    state,
    service,
    internetTechnology,
  })
    .count('*', { as: 'quantity' })
    .sum('invoice_lines.subTotal', { as: 'sub_total' })
    .sum('invoice_lines.total', { as: 'total' })
    .avg('invoice_lines.subTotal', { as: 'average_sub_total' })
    .avg('invoice_lines.total', { as: 'average_total' })
    .whereBetween('invoice_invoice.date', [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ]);

  return respondSuccess(result);
};

exports.getInvoiceProducts = async function (query) {
  const {
    service: _service,
    startDate: _startDate,
    endDate: _endDate,
    state,
  } = query;
  const startDate = moment(_startDate);
  const endDate = moment(_endDate);

  const { service, internetTechnology } = getServiceInfo(_service);

  const sql = invoiceLinesBaseQuery({ state, service, internetTechnology })
    .select(
      knex.raw("CONCAT(gf_fee_groups.id, ':', invoice_lines.productId) as id"),
      'invoice_lines.productId as product_id',
      'invoice_lines.productCode as product_code ',
      'invoice_products.name',
      'gf_sections.code',
      'gf_fees.internetTechnology as internet_technology',
      'gf_fee_groups.id as fee_group_id',
      'gf_fee_groups.name as fee_group_name',
      'gf_fee_groups.internalName as fee_group_internal_name',
    )
    .count('*', { as: 'quantity' })
    .sum('invoice_lines.subTotal', { as: 'sub_total' })
    .sum('invoice_lines.total', { as: 'total' })
    .avg('invoice_lines.subTotal', { as: 'average_sub_total' })
    .avg('invoice_lines.total', { as: 'average_total' })
    .whereBetween('invoice_invoice.date', [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ])
    .groupBy('gf_fee_groups.id', 'invoice_lines.productId')
    .orderByRaw('sum(invoice_lines.total) desc');

  return getAllRows({ query, sql });
};

exports.getInvoiceLines = async function (query) {
  const {
    service: _service,
    startDate: _startDate,
    endDate: _endDate,
    state,
  } = query;
  const startDate = moment(_startDate);
  const endDate = moment(_endDate);

  const { service, internetTechnology } = getServiceInfo(_service);

  const sql = invoiceLinesBaseQuery({
    state,
    service,
    internetTechnology,
  })
    .select(
      'invoice_lines.id',
      'invoice_lines.productId as product_id',
      'invoice_lines.productCode as product_code ',
      'invoice_lines.description',
      'invoice_lines.subTotal as sub_total',
      'invoice_lines.total',
      'invoice_invoice.code as invoice.code',
      'invoice_invoice.clientNif as invoice.client_nif',
      'invoice_invoice.clientName as invoice.client_name',
      'invoice_invoice.date as invoice.date',
      'invoice_products.name as product.name',
      'gf_sections.code',
      'gf_fees.internetTechnology as internet_technology',
      'gf_fee_groups.id as fee_group.id',
      'gf_fee_groups.name as fee_group.name',
      'gf_fee_groups.internalName as fee_group.internal_name',
      'gf_contracts.reference as contract.reference',
      'gf_contracts.clientId as contract.client_id',
    )
    .whereBetween('invoice_invoice.date', [
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD'),
    ]);

  return getAllRows({ query, sql, nested: true });
};

/**
 * @typedef {{
 *  id: string,
 *  product_id: number,
 *  name: string,
 *  code: string,
 *  fee_group_name: string,
 *  fee_group_internal_name: string,
 *  quantity: number,
 *  total: string,
 *  percent_change: string | null,
 *  percent_of_all: string,
 * }} InvoiceLineGroup
 */

const percentChange = (now, last) => (100 * (now / last - 1)).toFixed(2);

/**
 * @param {{
 *  month: string // in YYYY-MM format
 * }} param0
 */
exports.getInvoiceProductsChart = async function ({ month }) {
  const monthStart = moment(month).set('date', 1);
  const monthEnd = monthStart.clone().endOf('month');

  const lastMonthStart = monthStart.clone().subtract(1, 'month');
  const lastMonthEnd = monthEnd.clone().subtract(1, 'month');

  const sql = invoiceLinesBaseQuery()
    .select(
      knex.raw("CONCAT(gf_fee_groups.id, ':', invoice_lines.productId) as id"),
      'invoice_lines.productId as product_id',
      'invoice_lines.productCode as product_code ',
      'invoice_products.name',
      'gf_sections.code',
      'gf_fees.internetTechnology as internet_technology',
      'gf_fee_groups.id as fee_group_id',
      'gf_fee_groups.name as fee_group_name',
      'gf_fee_groups.internalName as fee_group_internal_name',
    )
    .count('*', { as: 'quantity' })
    .sum('invoice_lines.total', { as: 'total' })
    .where('invoice_lines.total', '>', 0)
    .groupBy('gf_fee_groups.id', 'invoice_lines.productId')
    .orderByRaw('sum(invoice_lines.total) desc');

  /** @type {InvoiceLineGroup[]} */
  const monthData = await sql
    .clone()
    .whereBetween('invoice_invoice.date', [
      monthStart.format('YYYY-MM-DD'),
      monthEnd.format('YYYY-MM-DD'),
    ]);

  /** @type {InvoiceLineGroup[]} */
  const lastMonthData = await sql
    .clone()
    .whereBetween('invoice_invoice.date', [
      lastMonthStart.format('YYYY-MM-DD'),
      lastMonthEnd.format('YYYY-MM-DD'),
    ]);

  const monthTotal = monthData.reduce((a, b) => Number(a) + Number(b.total), 0);

  const lastMonthTotal = lastMonthData.reduce(
    (a, b) => Number(a) + Number(b.total),
    0,
  );

  const monthPercentChange = percentChange(monthTotal, lastMonthTotal);

  const lastMonthDataMap = associateBy(lastMonthData, (e) => e.id);

  for (const product of monthData) {
    product.code = product.code.toLowerCase();
    product.percent_of_all = (
      (Number(product.total) / monthTotal) *
      100
    ).toFixed(2);

    const lastMonth = lastMonthDataMap[product.id];
    if (!lastMonth) {
      product.percent_change = null;
      continue;
    }

    product.percent_change = percentChange(
      Number(product.total),
      Number(lastMonth.total),
    );
  }

  const dataGroupedByCode = _.groupBy(monthData, 'code');

  const chart = Object.entries(dataGroupedByCode).map(([name, children]) => ({
    name,
    children,
  }));

  return respondSuccess({
    month: monthStart.format('YYYY-MM'),
    total: monthTotal.toFixed(2),
    percent_change: monthPercentChange,
    chart,
  });
};
