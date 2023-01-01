import { AireLine } from '@api/service/intranet/AireService';
import { revisionAireLines } from '@api/service/intranet/AireRevisionService';

export default async function importAirRequestLinesAction(params: {
  page: number;
  pageSize: number;
}): Promise<void> {
  const log = `Import AIRE lines action [date: ${new Date().toString()}][page: ${
    params.page
  }]`;
  console.time(log);
  const { rows } = await AireLine.paginated(
    {
      page: params.page,
      pageSize: params.pageSize,
    },
    {
      historico: 'S',
    },
  );
  await revisionAireLines(rows);
  console.timeEnd(log);
}
