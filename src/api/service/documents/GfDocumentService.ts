import { AnyModel, intranet, system } from '@models';

import { DataProtectionDocument } from '@api/models/intranet/intranet_data_protection_document';
import { DocStatus } from '@models/intranet/intranet_docs_status';
import { GfDoc } from '@models/intranet/intranet_gf_docs';
import _ from 'lodash';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { findForContract } from '@service/intranet/GfContractSectionStatusService';
import { getDocumentForStorageType } from './documents';
import { refreshBaseDataComplete } from './DocumentService';

const { GfClient, GfContract } = intranet;
const { Metadata } = system;

export async function createDoc({
  action,
  contractId,
  clientId: _clientId,
  sectionCode: _sectionCode,
  force = false,
}: {
  action: string;
  contractId: number;
  clientId?: number;
  sectionCode?: string;
  force?: boolean;
}): Promise<GfDoc> {
  if (!_clientId) {
    const contract = await GfContract.findByPk(contractId);
    if (!contract) throw new Error(`contract ${contractId} not found`);

    _clientId = contract.clientId;
  }

  const clientId = _clientId!;

  const sectionCode = _sectionCode ?? (await getSectionCode(contractId));
  const type = getDocumentType(action, sectionCode);

  const exist = await exists({
    action,
    clientId,
    contractId,
    sectionCode,
  });

  if (exist && !force) {
    return exist;
  }

  return createGfDoc({
    type,
    clientId,
    contractId,
    force,
  });
}

export async function getClientMissingDocs(clientId: number) {
  const client = await GfClient.findByPk(clientId);
  assert(client, new errors.NotFound(`client with id ${clientId} not found`));

  if (!client.active) {
    return [];
  }

  const found = await DataProtectionDocument.findOne({ where: { clientId } });

  return found ? [] : ['Proteccio Dades'];
}

const createGfDoc = async function (params: {
  type: string;
  clientId: number;
  contractId?: number;
  force: boolean;
}) {
  const { type, clientId, contractId } = params;

  const documentConfig = getDocumentForStorageType(type);

  const attributes = {
    type,
    contractId: contractId ?? -1,
    clientId,
    aireType: documentConfig.cellType ?? null,
  };
  const [model, created] = await GfDoc.findOrCreate({
    where: attributes,
  });

  const instance =
    params.force && !created ? await GfDoc.create(attributes) : model;

  await DocStatus.findOrCreate({
    where: {
      type: type ?? null,
      typeId: instance.id ?? null,
    },
    defaults: {
      title: type, // just a temporary title
      signed: false,
      onlyUpload: false,
      renderHash: null,
      baseDataComplete: true,
      baseDataCompleteInfo: null,
    },
  });

  await Metadata.findOrCreate({
    where: { key: `gf_doc_${instance.id}` },
    defaults: { value: JSON.stringify(params) },
  });

  return instance;
};

export const genericDocs = async function (contract: AnyModel, status: any) {
  return createDoc({
    action: 'alta',
    clientId: contract.clientId,
    contractId: contract.id,
    sectionCode: status.type,
  });
};

export const exists = async function ({
  sectionCode: _sectionCode,
  contractId,
  action,
  clientId,
}: {
  sectionCode?: string;
  contractId: number;
  action: string;
  clientId: number;
}): Promise<GfDoc | null> {
  const sectionCode = _sectionCode ?? (await getSectionCode(contractId));

  const documentType = getDocumentType(action, sectionCode);

  if (!documentType) {
    throw new Error(
      `Document type for action:${action} sectionCode:${sectionCode} not found`,
    );
  }

  return GfDoc.findOne({
    where: {
      clientId,
      contractId: contractId ?? null,
      type: documentType,
    },
  });
};

/**
 * Get type of document for given contrat id.
 *
 * @param  {string | number} _contractId
 * @returns {Promise<string>}
 */
const getSectionCode = async function (
  _contractId: string | number,
): Promise<string> {
  const contractId = Number(_contractId);

  if (!contractId || contractId < 1) return 'COMMON';

  const { type } = await findForContract(contractId);

  return type;
};

/**
 * This function will reload all the docs to make sure the state of them are correct
 * @param contractId
 * @returns
 */
export const refreshContractDocumentsBaseDataComplete = async function (
  contractId: number,
) {
  const docs = await GfDoc.findAll({
    where: {
      contractId: contractId ?? null,
    },
  });

  await Promise.all(docs.map(({ id }) => refreshBaseDataComplete(id)));
};

/**
 * Get storage type of generating document for the given action.
 */
const getDocumentType = function (action: string, sectionCode: string): string {
  // eslint-disable-next-line you-dont-need-lodash-underscore/get
  const value = _.get(documentTypes, `${sectionCode}.${action}`);
  assert(value, `DocumentType ${sectionCode}.${action} not found`);
  return value;
};

export const documentTypes = {
  SUBSCRIPTION: {
    alta: 'Goufone-Documents-AltaSubscription',
  },
  INTERNET: {
    alta: 'Goufone-Documents-AltaInternet',
  },
  TV: {
    alta: 'Goufone-Documents-AltaTv',
  },
  FIX: {
    alta: 'Goufone-Documents-AltaFix',
    PORTABILIDAD: 'Goufone-Documents-FixPortabilidad',
  },
  CELL: {
    CONTRATO: 'Goufone-Documents-CellContrato',
    PORTABILIDAD: 'Goufone-Documents-CellPortabilidad',
  },
  COMMON: {},
};
