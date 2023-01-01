'use strict';

const { GfInvoicePeriod, GfSection, sequelize } = require('@models').intranet;
const { respondSuccess } = require('@utils/response');
const { QueryTypes, Op } = require('sequelize');
const moment = require('moment');
const config = require('@config');
const _ = require('lodash');

const GfAnalytics_getAllProducts = async () => {
  const exeQuery = `SELECT gf_fees.tpvCode, gf_fee_groups.name, "FEE" AS type,
     (SELECT sectionId FROM gf_feegroups_sections_xref WHERE
        gf_feegroups_sections_xref.feeGroupId = gf_fee_groups.id AND gf_feegroups_sections_xref.status = 1 and
        gf_feegroups_sections_xref.uid =${config.get(
          'index.intranet.uid',
        )} ) AS sectionId FROM gf_fees LEFT JOIN
        gf_fee_groups ON gf_fee_groups.id = gf_fees.feeGroupId WHERE gf_fees.status = 1 AND gf_fee_groups.status = 1 AND
        tpvCode != "" AND tpvCode IS NOT NULL AND gf_fees.uid = ${config.get(
          'index.intranet.uid',
        )} GROUP BY tpvCode UNION
        SELECT tpvCode, NAME, "BONO" AS TYPE, sectionId FROM gf_bonus WHERE gf_bonus.uid = ${config.get(
          'index.intranet.uid',
        )} GROUP BY tpvCode UNION
        SELECT idTpv, alias, "DISC" AS TYPE, NULL FROM gf_discounts_matrix where gf_discounts_matrix.status = 1 AND gf_discounts_matrix.uid = ${config.get(
          'index.intranet.uid',
        )}
        GROUP BY idTpv UNION
        SELECT providerBonusId, name, "BONO" AS TYPE, (SELECT id from gf_sections where code ="CELL" and status = 1 and uid = ${config.get(
          'index.intranet.uid',
        )}) as sectionId FROM gf_cell_provider_fee_bonus WHERE status = 1 and uid = ${config.get(
    'index.intranet.uid',
  )}`;

  const result = await sequelize.query(exeQuery, {
    type: QueryTypes.SELECT,
    nest: true,
  });

  return result;
};

const GfAnalytics_getPeriodTotals = async (periodId) => {
  const exeQuery = `SELECT 
    invoice_lines.productCode,
    SUM(invoice_lines.total) AS total,
    count(*) as num FROM invoice_invoice 
    LEFT JOIN invoice_lines ON invoice_lines.invoiceId = invoice_invoice.id AND invoice_lines.status = 1
    WHERE invoice_invoice.refererKey LIKE '%[periodId:${periodId}]%' 
    AND invoice_invoice.status = 1 
    AND (invoice_invoice.state = "issued" OR invoice_invoice.state="proforma" OR invoice_invoice.state="canceled")
    GROUP BY invoice_lines.productCode`;

  const result = await sequelize.query(exeQuery, {
    type: QueryTypes.SELECT,
    nest: true,
  });

  return result;
};

const getAllProducts = async () => {
  const _products = await GfAnalytics_getAllProducts();
  const products = {};

  for (const p of _products) {
    products[p.tpvCode] = p;
  }

  return products;
};

const getPeriodTotals = async (periodId) => {
  const sections = await GfSection.findAll(
    { attributes: ['id', 'code'] },
    { raw: true },
  );
  const totals = await GfAnalytics_getPeriodTotals(periodId);
  const products = await getAllProducts();

  for (let k = 0; k < totals.length; k++) {
    const t = totals[k];
    if (!t.productCode) {
      totals.splice(k, 1);
      continue;
    }

    totals[k].description = products[t.productCode]
      ? products[t.productCode].name
      : '';
    totals[k].type = products[t.productCode]
      ? products[t.productCode].type
      : '';
    const temp = products[t.productCode]
      ? products[t.productCode].sectionId
      : '';
    totals[k].section =
      products[t.productCode] && sections.find((o) => o.id == temp)
        ? sections.find((o) => o.id == temp).code
        : '';
  }

  return totals;
};

const totalsComparationPast = async (periodId1) => {
  let period = await GfInvoicePeriod.findOne({
    where: { id: periodId1 },
  });

  const previousDate = moment(period.period)
    .subtract(1, 'months')
    .format('YYYY-MM-DD');
  period = await GfInvoicePeriod.findOne({
    where: { period: previousDate },
  });

  const periodId2 = period.id;

  const totals1 = await getPeriodTotals(periodId2);
  const totals2 = await getPeriodTotals(periodId1);

  for (let k = 0; k < totals2.length; k++) {
    const t = totals2[k];
    _.set(totals2, `${k}.total2`, 0);
    _.set(totals2, `${k}.num2`, 0);

    // search code in totals1
    let found = false;
    for (let kk = 0; kk < totals1.length; kk++) {
      const tt = totals1[kk];

      if (found) {
        break;
      }

      if (_.get(tt, 'productCode', '') === _.get(t, 'productCode', '')) {
        // found
        // add totals1 total in totals2
        totals2[k].total2 = tt?.total ?? 0;
        totals2[k].num2 = tt?.num ?? 0;
        found = true;
      }
    }
  }

  for (let k = 0; k < totals1.length; k++) {
    const t = totals1[k];
    let found = false;

    for (let kk = 0; kk < totals2.length; kk++) {
      const tt = totals2[kk];
      if (_.get(tt, 'productCode', '') === _.get(t, 'productCode', '')) {
        found = true;
        break;
      }
    }

    if (!found) {
      t.total2 = t.total;
      t.total = 0;
      t.num2 = t.num;
      t.num = 0;
      totals2.push({
        ...t,
      });
    }
  }
  return totals2;
};

exports.totalsComparativeForFront = async function (periodId) {
  const _rows = await totalsComparationPast(periodId);
  const rows = [];

  let currentTotal = 0;
  let lastTotal = 0;

  let currentTotalNum = 0;
  let lastTotalNum = 0;
  for (let k = 0; k < _rows.length; k++) {
    const r = _rows[k];

    const currentSubTotal = parseFloat(r.total2);
    const lastSubTotal = parseFloat(r.total);

    // add percent in €
    let diff = lastSubTotal - currentSubTotal;
    r.percent = parseFloat((diff * 100) / currentSubTotal).toFixed(1);
    currentTotal += currentSubTotal;
    lastTotal += lastSubTotal;

    //add percent in num
    const currentSubTotalNum = parseFloat(r.num2);
    const lastSubTotalNum = parseFloat(r.num);
    diff = lastSubTotalNum - currentSubTotalNum;
    r.percentNum = parseFloat((diff * 100) / currentSubTotalNum).toFixed(1);
    currentTotalNum += currentSubTotalNum;
    lastTotalNum += lastSubTotalNum;
    rows.push(r);
  }

  const totalDiff = lastTotal - currentTotal;
  const totalPercent = parseFloat((totalDiff * 100) / currentTotal).toFixed(1);

  const totalDiffNum = lastTotalNum - currentTotalNum;
  const totalNumPercent = parseFloat(
    (totalDiffNum * 100) / currentTotalNum,
  ).toFixed(1);

  return respondSuccess({
    totalPercent,
    totalNumPercent,
    currentTotalNum,
    lastTotalNum,
    currentTotal: currentTotal.toFixed(2),
    lastTotal: lastTotal.toFixed(2),
    rows,
  });
};
