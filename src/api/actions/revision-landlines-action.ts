import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import { handle as RevisionLandlines } from '@api/service/intranet/Actions/RevisionLandlines';

export default async function revisionLandlines(params: {
  page: number;
  pageSize: number;
}): Promise<void> {
  const log = `Revision landlines action [date: ${new Date().toString()}][page: ${
    params.page
  }]`;
  console.time(log);
  await RevisionLandlines(
    await OperadorLandline.findAll({
      offset: (params.page - 1) * params.pageSize,
      limit: params.pageSize,
      order: [['id', 'desc']],
    }),
  );
  console.timeEnd(log);
}
