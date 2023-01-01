import actionRunner from '@lib/action-runner';
import { Action } from '@models/global/global_action';
import { Bulk } from '@models/global/global_bulk';
import { findAndGet, getAllEntities } from '@utils/request-handler';
import { respondNotFound, respondSuccess } from '@utils/response';

export async function getBulks(query: any) {
  return getAllEntities(query, Bulk);
}

export async function getBulkById(id: number) {
  return findAndGet(id, Bulk);
}

export async function getBulkActions(id: number, query: any) {
  return getAllEntities(query, Action, { bulk_id: id });
}

export async function rerunAction(id: number) {
  const result = await actionRunner.rerunAction(id);
  if (!result) {
    return respondNotFound('Action not found');
  }
  return respondSuccess(result);
}

export async function changeBulkStatus(
  id: number,
  { status }: { status: Bulk['status'] },
) {
  let result;
  if (status === 'stopped') {
    result = await actionRunner.stopBulk(id);
  } else if (status === 'paused') {
    result = await actionRunner.pauseBulk(id);
  } else if (status === 'running') {
    result = await actionRunner.resumeBulk(id);
  }

  if (!result) {
    return respondNotFound('Bulk not found');
  }
  return respondSuccess(result);
}
