import { ActionEvent } from '@api/models/crud/crud_action_event';
import { FacadeFix } from '../Facades';
import { GfIvozFix } from '@api/models/intranet/intranet_gf_ivoz_fix';
import { User } from '@api/models/global/global_users';
import assert from 'assert';
import to from 'await-to-js';

export const destroyIvozConnection = async (contractId: number, user: User) => {
  const model = await GfIvozFix.findOne({ where: { contractId } });
  const [error] = await to(FacadeFix.down(contractId, user.userId));
  const ivozFix = await GfIvozFix.findOne({ where: { contractId } });

  if (ivozFix) {
    await ActionEvent.forResourceUpdate({
      resource: ivozFix,
      original: model,
      userId: user.id,
    }).markAsFinished();
  }

  assert(error === null, error!);

  return ivozFix;
};

export default destroyIvozConnection;
