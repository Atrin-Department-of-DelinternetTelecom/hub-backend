import { Document } from '@api/models/global/global_document';
import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { SepaDocument } from '@api/models/intranet/intranet_sepa_document';
import { intranet as knex } from '@lib/knex';
import assert from 'assert';
import { DelinternetStorage } from '../documents/storages/DelinternetStorage';
import { DocumentView } from '../documents/types';

export async function createIfNeeded(clientId: number, userId = 1) {
  const client = await GfClient.findByPk(clientId);
  assert(client, `GfClient with id:${clientId} not found`);
  if (!client.iban) return;
  if (!client.active) return;

  const lastSepa = await SepaDocument.findOne({
    where: {
      clientId,
    },
    order: [['id', 'DESC']],
  });

  if (lastSepa?.iban === client.iban) return;

  const document = await DelinternetStorage.create(
    'Delinternet-Documents-Sepa',
    userId,
  );

  await SepaDocument.create({
    clientId,
    iban: client.iban,
    bic: client.bic,
    bicName: client.bicName,
    docId: document.id,
  });
}

async function createUnsignedSepaForClientsWithNoSepa() {
  const clientsWithNoSepa: { id: number }[] = await knex('gf_clients')
    .select('gf_clients.id')
    .where({
      'gf_clients.status': 1,
      'gf_clients.active': 1,
    })
    .whereNotIn('gf_clients.id', knex('gf_sepa_documents').select('clientId'));

  for (const client of clientsWithNoSepa) {
    try {
      await createIfNeeded(client.id);
      console.log(`created init sepa for client with id:${client.id}`);
    } catch (e) {
      console.error(
        `error creating init sepa for client with id:${client.id}`,
        e,
      );
    }
  }
}

export async function getClientSepaDocs(
  clientId: number,
): Promise<DocumentView[]> {
  const sepaFromDocs = await SepaDocument.findAll({
    where: {
      clientId,
    },
    include: [
      {
        model: Document,
        as: 'doc',
      },
    ],
  });

  if (sepaFromDocs.length) {
    return sepaFromDocs.map((e) => Document.toDocumentView(e.doc));
  }

  const sepaFromGfDocs = await GfDoc.findAll({
    where: {
      type: 'Goufone-Documents-Sepa',
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

  return sepaFromGfDocs.map(GfDoc.toDocumentView);
}

export async function getLatestSepaDoc(
  clientId: number,
): Promise<DocumentView | null> {
  const sepaFromDocs = await SepaDocument.findOne({
    where: {
      clientId,
    },
    include: [
      {
        model: Document,
        as: 'doc',
      },
    ],
    order: [['id', 'DESC']],
  });

  if (sepaFromDocs) {
    return Document.toDocumentView(sepaFromDocs.doc);
  }

  const sepaFromGfDocs = await GfDoc.findOne({
    where: {
      type: 'Goufone-Documents-Sepa',
      clientId,
    },
    include: [
      {
        model: DocStatus,
        as: 'docStatus',
        required: true,
      },
    ],
    order: [['id', 'DESC']],
  });

  if (sepaFromGfDocs) {
    return GfDoc.toDocumentView(sepaFromGfDocs);
  }

  return null;
}

export const isLatestSepaSigned = async (
  clientId: number,
): Promise<boolean | null> => {
  const latestSepa = await getLatestSepaDoc(clientId);
  if (!latestSepa) return null;
  return latestSepa.signed;
};
