import { getPackage } from '@api/service/documents/DocumentService';

export default async function ensureOfDocumentPackageCaches(params: {
  packageId: string;
}): Promise<void> {
  const log = `[action][ensureOfDocumentPackageCaches][date: ${new Date().toString()}][packageId: ${
    params.packageId
  }]`;
  console.time(log);

  await getPackage(params.packageId, { ignoreHashCheck: true });

  console.timeEnd(log);
}
