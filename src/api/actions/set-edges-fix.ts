'use strict';

import { AnyModel, intranet } from '@models';
import {
  setEdges as kamailioSetEdges,
  removeStaticDataNeededInSetEdgesFromRedis,
} from '../service/intranet/FixCDR_GfTmpKamailioInvoiceService';

import CounterService from '../service/global/CounterService';

const { GfInvoicePeriod } = intranet;

export default async function setEdges(params: {
  periodId: number;
  month: number;
  year: number;
  page: number;
  tandas: number;
}) {
  console.log('set edges for fix contract job started', params);
  const { periodId, tandas } = params;
  await kamailioSetEdges(periodId, null, false, tandas);
  await CounterService.tick(`Invoice_FixEdges_${periodId}`);

  const counter = await CounterService.getCounter(
    `Invoice_FixEdges_${periodId}`,
  );
  // last tanda
  if (counter.max === counter.value) {
    await removeStaticDataNeededInSetEdgesFromRedis();
    const period = (await GfInvoicePeriod.findByPk(periodId)) as AnyModel;
    period.fixCdrEdgesDone = 'done';
    await period.save();
  }
}
