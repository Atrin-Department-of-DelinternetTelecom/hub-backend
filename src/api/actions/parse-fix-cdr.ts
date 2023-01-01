import CounterService from '../service/global/CounterService';
import { Static } from '@lib/cache';
import { parse as kamailioParser } from '../service/intranet/GfKamailioProviderCdrService';

export default async function parse(params: {
  fixCdrStatusId: number;
  memoryKey: string;
}) {
  console.log('parse fix cdr job started', params);
  const rows = JSON.parse(await Static.get(params.memoryKey));
  const pass = params.memoryKey.split('_').pop();
  await Static.forget(params.memoryKey);
  await kamailioParser(params.fixCdrStatusId, rows, pass!);
  await CounterService.tick(`GfKamailioProvidersCdr_${params.fixCdrStatusId}`);
}
