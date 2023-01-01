import { DataProtectionDocument } from '@api/models/intranet/intranet_data_protection_document';
import { DelinternetStorage } from '../documents/storages/DelinternetStorage';
import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { Document } from '@api/models/global/global_document';
import { DocumentView } from '../documents/types';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import assert from 'assert';

export async function createIfNeeded(clientId: number, userId = 1) {
  const client = await GfClient.findByPk(clientId);
  assert(client, `GfClient with id:${clientId} not found`);
  if (!client.active) return;

  const document = await DataProtectionDocument.findOne({
    where: { clientId },
  });

  if (document === null) {
    const { id: docId } = await DelinternetStorage.create(
      'Delinternet-Documents-DataProtection',
      userId,
    );

    return DataProtectionDocument.create({ clientId, docId });
  }

  return document;
}

export async function getDataProtectionDoc(
  clientId: number,
): Promise<DocumentView | null> {
  const documentFromDoc = await DataProtectionDocument.findOne({
    where: { clientId },
    include: [
      {
        model: Document,
        as: 'doc',
      },
    ],
  });

  if (documentFromDoc) {
    return Document.toDocumentView(documentFromDoc.doc);
  }

  const documentFromGfDoc = await GfDoc.findOne({
    where: {
      type: 'Goufone-Documents-ProteccioDades',
      clientId,
    },
    include: [
      {
        model: DocStatus,
        as: 'docStatus',
        required: true,
      },
    ],
  });

  if (documentFromGfDoc) {
    return GfDoc.toDocumentView(documentFromGfDoc);
  }

  return null;
}
