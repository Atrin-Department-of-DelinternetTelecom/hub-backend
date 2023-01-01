import AireLineTermination from '@api/service/documents/documents/AireLineTermination';
import AltaFix from '@service/documents/documents/AltaFix';
import AltaInternet from '@service/documents/documents/AltaInternet';
import AltaSubscription from '@api/service/documents/documents/AltaSubscription';
import AltaTv from '@service/documents/documents/AltaTv';
import CellContract from '@service/documents/documents/CellContract';
import CellPortability from '@service/documents/documents/CellPortability';
import ChangeHolder from '@service/documents/documents/ChangeHolder';
import ClientAgreement from '@api/service/documents/documents/ClientAgreement';
import { Document } from '@api/service/documents/document';
import FixPortability from '@service/documents/documents/FixPortability';
import { Knex } from 'knex';
import { intranet } from '@lib/knex';

export type Query = (clientId: number, contractId: number) => Knex.QueryBuilder;

export const queries: Record<string, Query> = {
  [AltaInternet.type]: (clientId, contractId) => {
    return gfDocs(AltaInternet, clientId, contractId);
  },
  [AltaSubscription.type]: (clientId, contractId) => {
    return gfDocs(AltaSubscription, clientId, contractId);
  },
  [AltaFix.type]: (clientId, contractId) => {
    return gfDocs(AltaFix, clientId, contractId);
  },
  [AltaTv.type]: (clientId, contractId) => gfDocs(AltaTv, clientId, contractId),
  [CellContract.type]: (clientId, contractId) => {
    return gfDocs(CellContract, clientId, contractId).whereExists(
      intranet('gf_contract_data_cell')
        .select(1)
        .limit(1)
        .where({ contractId })
        .whereNotNull('providerRequestCode'),
    );
  },
  [CellPortability.type]: (clientId, contractId) => {
    return gfDocs(CellPortability, clientId, contractId).whereExists(
      intranet('gf_contract_data_cell')
        .select(1)
        .limit(1)
        .where({ contractId, portability: 1 })
        .whereNotNull('providerRequestCode'),
    );
  },
  [FixPortability.type]: (clientId, contractId) => {
    return gfDocs(FixPortability, clientId, contractId);
  },
  [ChangeHolder.type]: (clientId, contractId) => {
    return docs(ChangeHolder, 'gf_contracts_holder_change', 'docId').where(
      'gf_contracts_holder_change.contractId',
      contractId,
    );
  },
  [ClientAgreement.type]: (clientId, contractId) => {
    return docs(
      ClientAgreement,
      'delinternet_hub.client_agreements',
      'doc_id',
    ).where('delinternet_hub.client_agreements.contract_id', contractId);
  },
  [AireLineTermination.type]: (clientId, contractId) => {
    return docs(
      AireLineTermination,
      'delinternet_hub.suspending_actions',
      'doc_id',
    ).where('delinternet_hub.suspending_actions.gf_contract_id', contractId);
  },
};

export const union = (queries: Knex.QueryBuilder[]): Knex.QueryBuilder => {
  return intranet
    .queryBuilder()
    .select('docs.*')
    .from(intranet.queryBuilder().unionAll(queries).as('docs'))
    .orderBy('docs.createdAt', 'desc');
};

const r = (n: string) => intranet.raw(n);

const gfDocs = (doc: Document, clientId: number, contractId: number) =>
  intranet('gf_docs')
    .select(
      r("concat('gf-doc:',gf_docs.id) as id"),
      r(`'${doc.type}' as type`),
      'docs_status.title',
      'docs_status.signed',
      'docs_status.signatureUploadedDate as signatureUploadDate',
      'docs_status.baseDataComplete',
      'docs_status.creationDate as createdAt',
    )
    .innerJoin('docs_status', {
      'gf_docs.id': 'docs_status.typeId',
    })
    .innerJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' })
    .where({
      'gf_docs.contractId': contractId,
      'gf_docs.clientId': clientId,
      'gf_docs.type': doc.storageType,
      'gf_contracts.status': 1,
    });

const docs = (doc: Document, from: string, joinColumn: string) =>
  intranet(from)
    .select(
      r("concat('del:',global_documents.id) as id"),
      r(`'${doc.type}' as type`),
      'global_documents.title',
      'global_documents.signed',
      'global_documents.signature_upload_date as signatureUploadDate',
      'global_documents.base_data_complete as baseDataComplete',
      'global_documents.created_at as createdAt',
    )
    .innerJoin('delinternet_hub.global_documents', {
      'global_documents.id': joinColumn,
    });
