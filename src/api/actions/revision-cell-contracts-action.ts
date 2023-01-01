import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { handle as RevisionCellContracts } from '@api/service/intranet/Actions/RevisionCellContracts';

export default async function revisionCellContractsAction(params: {
  page: number;
  pageSize: number;
}): Promise<void> {
  const log = `Revision cell contracts action [date: ${new Date().toString()}][page: ${
    params.page
  }]`;
  console.time(log);
  await RevisionCellContracts(
    await GfAireContract.findAll({
      offset: (params.page - 1) * params.pageSize,
      limit: params.pageSize,
      order: [['siglas', 'desc']],
    }),
  );
  console.timeEnd(log);
}
