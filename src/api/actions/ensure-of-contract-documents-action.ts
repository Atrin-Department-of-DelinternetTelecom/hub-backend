import { ensureOfDocumentByContractId } from '@api/service/intranet/GfContractService';

export default async function ensureOfContractDocumentsAction(params: {
  contractId: number;
}): Promise<void> {
  const log = `ensureOfContractDocumentsAction [date: ${new Date().toString()}][contractId: ${
    params.contractId
  }]`;
  console.time(log);

  await ensureOfDocumentByContractId(params.contractId);

  console.timeEnd(log);
}
