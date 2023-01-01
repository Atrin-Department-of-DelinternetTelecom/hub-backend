import { AireUploadHistory } from '@api/models/intranet/intranet_aire_upload_history';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';

export default async function transmitDocumentUploadHistory(params: {
  documents: number[];
  userId?: number;
}): Promise<void> {
  const log = `Transmit document upload histories action [date: ${new Date().toString()}][documents: ${params.documents.join(
    ',',
  )}]`;
  console.time(log);
  const gfDocs = await GfDoc.findAll({ where: { id: params.documents } });
  const transmittable = gfDocs.filter((gfDoc) => {
    return Array.isArray(gfDoc.uploadHistory);
  });
  for (const gfDoc of transmittable) {
    // clean old transmitted records
    await AireUploadHistory.destroy({ where: { document_id: gfDoc.id } });
    // add new records
    await AireUploadHistory.bulkCreate(
      gfDoc.uploadHistory.map(({ date, userId, result }) => {
        return {
          uploaded_at: date,
          user_id: userId ?? params.userId,
          success: Boolean(result.success),
          error: result.reason,
          document_id: gfDoc.id,
        };
      }),
    );

    await gfDoc.update({ uploadHistory: null });
  }
  console.timeEnd(log);
}
