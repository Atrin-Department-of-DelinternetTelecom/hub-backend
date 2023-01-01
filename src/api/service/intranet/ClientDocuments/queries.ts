import knex, { Knex } from 'knex';

import AireLineTermination from '@api/service/documents/documents/AireLineTermination';
import AltaFix from '@service/documents/documents/AltaFix';
import AltaInternet from '@service/documents/documents/AltaInternet';
import AltaTv from '@service/documents/documents/AltaTv';
import CellContract from '@service/documents/documents/CellContract';
import CellPortability from '@service/documents/documents/CellPortability';
import ChangeHolder from '@service/documents/documents/ChangeHolder';
import ChangeIban from '@service/documents/documents/ChangeIban';
import ClientAgreement from '@api/service/documents/documents/ClientAgreement';
import DataProtection from '@service/documents/documents/DataProtection';
import { Document } from '@api/service/documents/document';
import FixPortability from '@service/documents/documents/FixPortability';
import GrantPermission from '@service/documents/documents/GrantPermission';
import Sepa from '@service/documents/documents/Sepa';
import { intranet } from '@lib/knex';

export const queries = {
  [Sepa.type]: (clientId: number) =>
    docs(Sepa, 'gf_sepa_documents', 'gf_sepa_documents.docId').where({
      clientId,
    }),

  [DataProtection.type]: (clientId: number) => {
    return docs(
      DataProtection,
      'gf_data_protection_documents',
      'gf_data_protection_documents.docId',
    ).where({
      clientId,
    });
  },

  [AltaInternet.type]: (clientId: number) =>
    gfDocs(AltaInternet)
      .where({
        'gf_docs.clientId': clientId,
        'gf_contracts.status': 1,
      })
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' }),

  [AltaFix.type]: (clientId: number) =>
    gfDocs(AltaFix)
      .where({
        'gf_docs.clientId': clientId,
        'gf_contracts.status': 1,
      })
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' }),

  [AltaTv.type]: (clientId: number) =>
    gfDocs(AltaTv)
      .where({
        'gf_docs.clientId': clientId,
        'gf_contracts.status': 1,
      })
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' }),

  [CellContract.type]: (clientId: number) =>
    gfDocs(CellContract)
      .where({
        'gf_docs.clientId': clientId,
        'gf_contracts.status': 1,
      })
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' })
      .whereExists(
        intranet('gf_contract_data_cell')
          .select(1)
          .limit(1)
          .where({ contractId: r('gf_docs.contractId') })
          .whereNotNull('providerRequestCode'),
      ),

  [CellPortability.type]: (clientId: number) =>
    gfDocs(CellPortability)
      .where({ 'gf_docs.clientId': clientId, 'gf_contracts.status': 1 })
      .whereExists(
        intranet('gf_contract_data_cell')
          .select(1)
          .limit(1)
          .where({ contractId: r('gf_docs.contractId'), portability: 1 })
          .whereNotNull('providerRequestCode'),
      )
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' }),

  [FixPortability.type]: (clientId: number) =>
    gfDocs(FixPortability)
      .where({
        'gf_docs.clientId': clientId,
        'gf_contracts.status': 1,
      })
      .leftJoin('gf_contracts', { 'gf_contracts.id': 'gf_docs.contractId' }),

  [ChangeHolder.type]: (clientId: number) =>
    docs(ChangeHolder, 'gf_contracts_holder_change', 'docId')
      .where('gf_contracts_holder_change.status', 1)
      .where(function () {
        this.where('gf_contracts_holder_change.fromClientId', clientId).orWhere(
          'gf_contracts_holder_change.toClientId',
          clientId,
        );
      }),

  [ChangeIban.type]: (clientId: number) =>
    docs(ChangeIban, 'delinternet_hub.change_bank_numbers', 'doc_id').where(
      'change_bank_numbers.gf_client_id',
      clientId,
    ),

  [GrantPermission.type]: (clientId: number) =>
    docs(
      GrantPermission,
      'delinternet_hub.hrms_grant_permission',
      'doc_id',
    ).where('hrms_grant_permission.client_id', clientId),

  [ClientAgreement.type]: (clientId: number) =>
    docs(
      ClientAgreement,
      'delinternet_hub.client_agreements',
      'doc_id',
    ).innerJoin('gf_contracts as gc', function () {
      this.on('gc.id', 'client_agreements.contract_id').andOnIn('gc.clientId', [
        clientId,
      ]);
    }),
  [AireLineTermination.type]: (clientId: number) =>
    docs(
      AireLineTermination,
      'delinternet_hub.suspending_actions',
      'doc_id',
    ).innerJoin('gf_contracts as gc', function () {
      this.on('gc.id', 'suspending_actions.gf_contract_id').andOnIn(
        'gc.clientId',
        [clientId],
      );
    }),
};

export const union = (queries: Knex.QueryBuilder[]): Knex.QueryBuilder => {
  return intranet
    .queryBuilder()
    .select('docs.*')
    .from(intranet.queryBuilder().unionAll(queries).as('docs'))
    .orderBy('docs.createdAt', 'desc');
};

const r = (n: string) => intranet.raw(n);

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

const gfDocs = (doc: Document) =>
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
    .where({
      'gf_docs.type': doc.storageType,
    });
