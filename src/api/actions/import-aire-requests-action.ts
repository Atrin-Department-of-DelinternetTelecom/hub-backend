import { AireRequestLine } from '@api/service/intranet/AireService';
import { revisionAireRequests } from '@api/service/intranet/AireRevisionService';

export default async function importAirRequestsAction(params: {
  page: number;
  pageSize: number;
}): Promise<void> {
  const log = `Import AIRE request lines action [date: ${new Date().toString()}][page: ${
    params.page
  }]`;
  console.time(log);
  const { rows } = await AireRequestLine.paginated({
    page: params.page,
    pageSize: params.pageSize,
  });
  await revisionAireRequests(rows);
  console.timeEnd(log);
}
