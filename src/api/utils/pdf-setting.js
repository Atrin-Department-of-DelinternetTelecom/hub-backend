'use strict';

module.exports = {
  GfClient: [
    'id',
    'active',
    'idTpv',
    'name',
    'fiscalId',
    'emailAddress',
    'contactPhone',
  ],
  GfContract: ['id', 'status', 'dateActivation', 'dateDeactivation'],
  CrTask: ['id', 'alias', 'creationDate', 'updateDate'],
  GfFeeGroup: ['id', 'active', 'name', 'internalName'],
  GfUser: ['id', 'email', 'name', 'collaboratorId', 'distributorId', 'role'],
  GfCollaborator: ['id', 'name'],
  GfDistributors: ['id', 'name', 'collaboratorId'],
  GfCrmEvent: ['id', 'reference'],
  CrTaskType: ['id', 'name', 'executable'],
  CrTaskExtraField: ['id', 'name'],
  InvoiceClientsExtraFieldsCategory: ['id', 'name'],
  SignaturePad: ['id', 'name'],
};
