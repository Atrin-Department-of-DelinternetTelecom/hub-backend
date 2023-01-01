import { revisionClient } from '@api/service/intranet/LemonRevisionService';
import to from 'await-to-js';

export default async function revisionLandlines(params: {
  fiscalIds: string[];
  userId?: number;
}): Promise<void> {
  const log = `Revision lemon lines action [date: ${new Date().toString()}][page: ${params.fiscalIds.join(
    ',',
  )}]`;
  console.time(log);
  for (const fiscalId of params.fiscalIds) {
    const [error] = await to(revisionClient(fiscalId, params.userId));

    if (error) console.error(error);
  }
  console.timeEnd(log);
}
