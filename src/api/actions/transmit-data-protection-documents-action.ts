import * as s3 from '@lib/s3';

import { DataProtectionDocument } from '@api/models/intranet/intranet_data_protection_document';
import { DateTime } from 'luxon';
import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';
import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { Document } from '@models/global/global_document';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { createIfNeeded } from '@api/service/intranet/GfClientDataProtectionDoc';
import moment from 'moment';
import to from 'await-to-js';

export default async function transmitDataProtectionDocumentsAction(params: {
  documents: number[];
  userId?: number;
}): Promise<void> {
  const log = `Transmit data protection documents action [date: ${new Date().toString()}][documents: ${params.documents.join(
    ',',
  )}]`;
  console.time(log);
  const gfDocs = await GfDoc.findAll({
    where: { id: params.documents },
    include: { model: DocStatus, as: 'docStatus' },
  });

  for (const gfDoc of gfDocs) {
    // ensure of new documents
    const dataProtectionDoc = await createIfNeeded(
      gfDoc.clientId,
      params.userId,
    );
    // document is not required yet!
    if (!dataProtectionDoc) continue;
    // save old dates
    dataProtectionDoc.setDataValue('creationDate', gfDoc.creationDate);
    dataProtectionDoc.setDataValue('updateDate', gfDoc.updateDate);
    await dataProtectionDoc.save();
    // document not signed yet!
    if (!gfDoc.docStatus.imageSignature) {
      // remove old data
      await Promise.all([gfDoc.destroy(), gfDoc.docStatus.destroy()]);
      continue;
    }
    // move signature to new document
    const [error, signature] = await to(
      s3.download('gf-doc-signatures', gfDoc.docStatus.imageSignature),
    );
    // revert changes
    if (error) {
      console.error(error);
      await Promise.all([
        dataProtectionDoc.destroy({ force: true }),
        Document.destroy({ where: { id: dataProtectionDoc.docId } }),
      ]);
    }

    if (signature) {
      const storage = await DelinternetStorage.load(dataProtectionDoc.docId);

      await storage.setSignature(signature, 'default');
      await Document.update(
        {
          signatureUploadDate: moment(
            gfDoc.docStatus.signatureUploadedDate,
          ).toDate(),
        },
        { where: { id: dataProtectionDoc.docId } },
      );
    }
    // remove old data
    await Promise.all([gfDoc.destroy(), gfDoc.docStatus.destroy()]);
  }
  console.timeEnd(log);
}
