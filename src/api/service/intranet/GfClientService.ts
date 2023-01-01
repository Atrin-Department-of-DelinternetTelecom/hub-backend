import * as GfClientDataProtectionDoc from './GfClientDataProtectionDoc';
import * as GfClientSepa from './GfClientSepa';

import { AireCustomer, AireRequestLine } from './AireService';
import { AnyModel, intranet, system } from '@models';
import { Manager, Sequelize } from '@lib/search';
import { Op, literal } from 'sequelize';
import _, { groupBy } from 'lodash';
import {
  clientResume,
  clientUnpaid,
} from '@service/intranet/GfContractsUnpaidService';
import {
  createCatch,
  findAllEntities,
  findAndDelete,
  findAndDeleteIntranet,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';
import { downloadFile, uploadFile } from '../file/fileService';
import {
  is2xx,
  respondBadRequest,
  respondCreated,
  respondSuccess,
  respondSuccessWithPagination,
  respondWithError,
} from '@utils/response';
import { spainIdType, validateSpanishId } from 'spain-id';

import { ActionEvent } from '@api/models/crud/crud_action_event';
import { Aire } from '@lib/sdk';
import { Builder } from '@del-internet/support-search';
import { CreateCustomerParams } from '@delinternet/sdk-aire';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfCollaborator } from '@api/models/intranet/intranet_gf_collaborator';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import InvoiceClientService from '@service/intranet/InvoiceClientService';
import { handle as MeiliSearchClientSync } from './Actions/MeiliSearchClientSync';
import { Parser } from '@json2csv/plainjs';
import { handle as SyncClientsWithAire } from './Actions/SyncClientsWithAire';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import assert from 'assert';
import config from '@config';
import { errors } from '@api/http/http_errors';
import { firstPopulated } from '@api/utils/helpers';
import iban from 'iban';
import { intranet as knex } from '@lib/knex';
import { lemon } from '@lib/lemon';
import moment from 'moment';
import niv from 'node-input-validator';
import { pluck } from '@api/utils/collections';
import { revisionClient } from './AireRevisionService';
import to from 'await-to-js';
import { updateAllFromClient } from '@service/intranet/GfDiscountsPendingService';
import { validateIban } from './IbanService';
import { writeFile } from '@api/utils/writer';

const {
  DocStatus,
  GfSubscriberType,
  GfDocumentType,
  GfContractDataTv,
  GfContract,
  GfContractDataCell,
  GfContractDataFix,
  GfContractDataInternet,
  GfFeeGroup,
  GfSection,
  GfUser,
  InvoiceClient,
  InvoiceClientsExtraField,
  InvoiceClientExtraFieldXref,
  Country,
  InvoiceClientsContact,
  GfIncidence,
  GfContractHolderChange,
  GfContractSectionStatus,
  GfDiscountsMatrix,
  GfDiscountsMatrixRule,
} = intranet;

const { Document, ChangeBankNumber, GrantPermission } = system;

niv.bailable(true);

niv.extend(
  'checkAddressCode',
  ({ value, attr }: Record<string, any>, { inputs }: Record<string, any>) => {
    return !value || !!inputs[`${attr}Code`];
  },
);
niv.extend('isValidSubscriberType', async ({ value }: Record<string, any>) => {
  return (await GfSubscriberType.findByPk(value)) !== null;
});

niv.extend(
  'requiredContactPhone',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    if (!Number(inputs.id) || value) return true;

    const client = await GfClient.findByPk(inputs.id, {
      raw: true,
      attributes: ['active'],
    });

    return !Number(client?.active);
  },
);

niv.extend('isValidDocumentType', async ({ value }: Record<string, any>) => {
  return (await GfDocumentType.findByPk(value)) !== null;
});
niv.extend(
  'clientFiscalIdUnique',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const client = await GfClient.findOne({
      where: { fiscalId: value, id: { [Op.not]: inputs.id ?? null } },
    });
    return client === null;
  },
);
niv.extend(
  'clientPhoneNumberUnique',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    if (value) {
      const client = await GfClient.findOne({
        where: {
          contactPhone: value,
          ...(inputs.id ? { id: { [Op.ne]: inputs.id } } : {}),
        },
      });
      return client === null;
    }
    return true;
  },
);
niv.extend(
  'clientFiscalIdFormat',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    // Subscriber Types
    const subscriberTypes = await _getIndexedSubscriberTypes();
    const EXTRANGER = subscriberTypes[2];
    const RESIDENCIAL = subscriberTypes[0];
    const EMPRESA = subscriberTypes[1];
    // const AUTONOM = subscriberTypes[5];

    // Document Types
    const documentTypes = await _getIndexedDocumentTypes();
    const DNI = documentTypes[0];
    const NIE = documentTypes[1];
    const CIF = documentTypes[4];
    const PASSPORT = documentTypes[2];

    const fiscalIdType = spainIdType(value)?.toUpperCase();

    if (fiscalIdType === 'DNI' && inputs.documentTypeId !== DNI) {
      return false;
    }

    if (fiscalIdType === 'DNI' && inputs.subscriberTypeId !== RESIDENCIAL) {
      return false;
    }

    if (fiscalIdType === 'NIE' && inputs.documentTypeId !== NIE) {
      return false;
    }

    if (fiscalIdType === 'NIE' && inputs.subscriberTypeId !== EXTRANGER) {
      return false;
    }

    if (fiscalIdType === 'NIF' && inputs.documentTypeId !== DNI) {
      return false;
    }

    if (fiscalIdType === 'NIF' && inputs.subscriberTypeId !== RESIDENCIAL) {
      return false;
    }

    if (fiscalIdType === 'CIF' && inputs.documentTypeId !== CIF) {
      return false;
    }

    if (fiscalIdType === 'CIF' && inputs.subscriberTypeId !== EMPRESA) {
      return false;
    }

    return fiscalIdType
      ? validateSpanishId(value)
      : inputs.documentTypeId === PASSPORT;
  },
);

/**
 * using a getter function. to protect the relation ships from mutations
 */
const getClientRelations = () => [
  {
    model: InvoiceClientsExtraField,
    as: 'extraFields',
    required: false,
    attributes: ['name', 'id', 'label'],
    raw: true,
  },
  {
    model: Country,
    as: 'nationality',
    required: false,
    attributes: ['id', 'name', 'isoCode'],
    raw: true,
  },
  {
    model: GfUser,
    as: 'user',
    required: false,
    attributes: ['id', 'name', 'email', 'userId'],
    raw: true,
  },
  {
    model: GfCollaborator,
    as: 'collaborator',
    required: false,
    attributes: ['id', 'name'],
    raw: true,
  },
];

niv.extend('validateIban', async ({ value }: Record<string, any>) => {
  return value ? iban.isValid(value) : true;
});
niv.extend(
  'authorizeIbanChange',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    // on creation form
    if (!Number(inputs.id)) {
      return true;
    }
    // check client state
    const client = await GfClient.findByPk(inputs.id);
    assert(client, `Client with id ${inputs.id} not found`);
    // no changes
    if (value === client.iban) {
      return true;
    }
    return authorizedToChangeIban(inputs.id);
  },
);

const authorizedToChangeIban = async (id: number) => {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  const signed = await GfClientSepa.isLatestSepaSigned(id);

  return signed === null ? true : Boolean(!signed);
};

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
export const deleteGfClientsId = async function (id: number) {
  await MeiliSearchClientSync([id], true);

  return findAndDelete(id, GfClient);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
export const destoryGfClientsId = async function (id: number) {
  await MeiliSearchClientSync([id], true);

  return findAndDeleteIntranet(id, GfClient);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
export const syncGfClients = async function () {
  await MeiliSearchClientSync();

  return respondSuccess('done');
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
export const getGfClients = async function (query: Record<string, any>) {
  return getAllEntities(query, GfClient, undefined, getClientRelations());
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
export const getGfClientsId = async function (id: number) {
  const [client, authorized] = await Promise.all([
    GfClient.findByPk(id, { include: { all: true, required: false } }),
    authorizedToChangeIban(id),
  ]);

  assert(client, new errors.NotFound(`Client with id ${id} not found!`));

  return respondSuccess({
    ...client.get({ plain: true }),
    authorizedToChangeIban: authorized,
  });
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
export const postGfClients = async function (
  body: Record<string, any>,
  user: AnyModel,
) {
  const validator = _validator(body);
  const subscriberType = await GfSubscriberType.findByPk(body.subscriberTypeId);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  body.needBusinessName = subscriberType?.needBusinessName;
  body.address = body.addressStreet + ' ' + body.addressNumber;

  body.requiresFacturae =
    body.requiresFacturae === true ||
    body.requiresFacturae === 1 ||
    body.requiresFacturae === '1' ||
    body.requiresFacturae === 'true';

  body.centreCode = body.centreCode ? String(body.centreCode).trim() : null;

  if (!subscriberType?.needBusinessName) {
    body.name = [
      body.contactName,
      body.contactFamilyName1,
      body.contactFamilyName2,
    ]
      .filter((val) => val)
      .join(' ')
      .replace(/\s+/g, ' ');
  }

  const postInvoiceClientsResponse =
    await InvoiceClientService.postInvoiceClients({
      isBusiness: body.needBusinessName,
      name: body.name,
      surname1: body.contactFamilyName1,
      surname2: body.contactFamilyName2,
      alias: body.alias,
      comments: body.comments,
      logo: body.logo,
      phone: body.contactPhone,
      address: body.address,
      email: body.emailAddress,
      countryCode: 'ES',
      gender: 'male',
      city: body.addressCity,
      state: body.addressProvince,
      postalCode: body.addressPostalCode,
      nif: body.fiscalId,
      businessName: body.name,
      excludeFromMailings: body.excludeFromMailings,
    });

  body.invoiceClientId = postInvoiceClientsResponse.unwrap().id;
  // TODO:
  // not nedd more do removing IBAN service
  // if (body.iban && (!body.bicName || !body.bic)) {
  //   const { bic, bank } = (await validateIban(body.iban)).unwrap();
  //   body.bic = bic;
  //   body.bicName = bank;
  // }

  const response = await createCatch(
    { ...body, userId: user.userId },
    GfClient,
  );
  if (!is2xx(response.code)) return response;
  //@ts-ignore
  const client = response.payload.data;

  await ActionEvent.forResourceCreate({
    payload: body,
    userId: user.id,
    resource: client,
  }).markAsFinished();

  await syncTags(client.id, body.tags);

  await ensureOfDocument(client);
  // update meilieserach
  await MeiliSearchClientSync([client.id]);

  return response;
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
export const putGfClientsId = async function (
  body: Record<string, any>,
  id: number,
  user: AnyModel,
) {
  const model = await GfClient.findByPk(id);
  assert(model);
  const userId = Number(model.userId) || user.userId;
  const validator = await _validator(
    Object.assign(model.get({ plain: true }), body),
    id,
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  let invoiceClient = await InvoiceClient.findByPk(model.invoiceClientId);
  const subscriberType = await GfSubscriberType.findByPk(
    body.subscriberTypeId || model.subscriberTypeId,
  );

  if (invoiceClient === null) {
    invoiceClient = await InvoiceClient.create({
      clientId: model.id,
    });

    await model.update({
      invoiceClientId: invoiceClient.id,
    });
  }
  //TODO:
  // not need more to removing IBAN service
  // if (body.iban && (!body.bicName || !body.bic)) {
  //   const { bic, bank } = (await validateIban(body.iban)).unwrap();
  //   body.bic = bic;
  //   body.bicName = bank;
  // }

  body.needBusinessName = subscriberType
    ? subscriberType.needBusinessName
    : null;

  body.contactName =
    body.contactName !== undefined
      ? firstPopulated([body.contactName])
      : model.contactName;
  body.contactFamilyName1 =
    body.contactFamilyName1 !== undefined
      ? firstPopulated([body.contactFamilyName1])
      : model.contactFamilyName1;
  body.contactFamilyName2 =
    body.contactFamilyName2 !== undefined
      ? firstPopulated([body.contactFamilyName2])
      : model.contactFamilyName2;

  if (!body.needBusinessName) {
    body.name = [
      body.contactName,
      body.contactFamilyName1,
      body.contactFamilyName2,
    ]
      .filter((val) => val)
      .join(' ')
      .replace(/\s+/g, ' ');
  }

  if (body.requiresFacturae !== undefined) {
    body.requiresFacturae =
      body.requiresFacturae === true ||
      body.requiresFacturae === 1 ||
      body.requiresFacturae === '1' ||
      body.requiresFacturae === 'true';
  }

  if (body.centreCode !== undefined) {
    body.centreCode = body.centreCode ? String(body.centreCode).trim() : null;
  }

  if (body.formName === 'marketing') {
    await syncTags(model.id, body.tags);
  }

  return findAndUpdate(id, { ...body, userId }, GfClient)
    .then(async (response) => {
      if (response.payload.code !== 200) return response;

      const client = response.payload.data;

      await ActionEvent.forResourceUpdate({
        payload: body,
        resource: client,
        original: model,
        userId: user.id,
      }).markAsFinished();
      // update search engine
      await MeiliSearchClientSync([client.id]);
      await GfClientSepa.createIfNeeded(client.id, user.id);

      return exports
        .updateClientInvoice(client, invoiceClient, body)
        .then(async (invoiceResponse: Record<string, any>) => {
          if (invoiceResponse.payload.code !== 200) return invoiceResponse;
          // sync to Aire when Aire code prepared
          if ((model.aireCode || body.aireCode) && !Aire.readonly) {
            const [error] = await to(syncToAire(model.id));
            if (error) console.error(error);
          }

          await ensureOfDocument(client);
          // regenerateHashFromClient(client.id);

          return getGfClientsId(model.id);
        })
        .catch((error: any) => error);
    })
    .catch((error) => error);
};

/**
 * Sync extra fields of given client.
 *
 * @param  {number} id   [description]
 * @param  {any[]} tags [description]
 */
export const syncTags = async function (id: number, tags: number[]) {
  await InvoiceClientExtraFieldXref.destroy({
    where: {
      clientId: id,
    },
  });

  for (const item in tags) {
    await InvoiceClientExtraFieldXref.create({
      extraFieldId: tags[item],
      clientId: id,
    });
  }
};

export const updateClientInvoice = async function (
  client: AnyModel,
  invoiceClient: AnyModel,
  body: Record<string, any>,
) {
  return InvoiceClientService.putInvoiceClientsId(client.invoiceClientId, {
    isBusiness: body.needBusinessName,
    name: client.name,
    surname1: client.contactFamilyName1,
    surname2: client.contactFamilyName2,
    alias:
      body.formName === 'specifications' ? body.alias : invoiceClient.alias,
    comments:
      body.formName === 'marketing' ? body.comments : invoiceClient.comments,
    logo: body.formName === 'specifications' ? body.logo : invoiceClient.logo,
    phone: client.contactPhone,
    address: client.addressStreet,
    number: client.addressNumber,
    email: client.emailAddress,
    countryCode: 'ES',
    gender: 'male',
    city: client.addressCity,
    state: client.addressProvince,
    postalCode: client.addressPostalCode,
    nif: client.fiscalId,
    businessName: client.name,
    excludeFromMailings:
      body.formName === 'specifications'
        ? body.excludeFromMailings
        : invoiceClient.excludeFromMailings,
  });
};

class AireDataNotEmptyError extends errors.BadRequest {
  type = 'AIRE_DATA_NOT_EMPTY';
}

class AireDataEmptyError extends errors.BadRequest {
  type = 'AIRE_DATA_EMPTY';
}

export const syncToAire = async function (clientId: number) {
  const client = await GfClient.findByPk(clientId);
  assert(client);

  const hydrateClient = await hydrate(client);
  const aireData = await buildAireDataFromClient(
    hydrateClient as GfClient & Record<string, unknown>,
  );

  const aireClient = await AireCustomer.findOne({
    fiscalId: hydrateClient.fiscalId,
  });

  if (hydrateClient.aireCode) {
    // update user, aire data cannot be empty
    if (!aireClient?.cod) {
      throw new AireDataEmptyError();
    }
    //@ts-ignore
    const [error, result] = await to(Aire.editCustomer(aireData));
    if (error) {
      await client.update({ lastAireError: error.message ?? String(error) });
      throw error;
    } else {
      await client.update({ lastAireError: null });
    }

    return result;
  }

  // create new user, aire data must be empty
  if (aireClient?.cod) throw new AireDataNotEmptyError();

  const [error, result] = await to(Aire.createCustomer(aireData));
  if (error) {
    await client.update({ lastAireError: error?.message ?? String(error) });
    throw error;
  }

  const createdClient = await AireCustomer.findOne({
    fiscalId: client.fiscalId,
  });

  // user not found on aire
  assert(createdClient?.cod, 'User not found on AIRE service');

  await client.update({
    lastAireError: null,
    aireCode: createdClient?.cod,
    active: 1, // set client active and don't let future fiscalId modifications
  });
};

export const hydrate = async function (client: AnyModel) {
  client.documentPath = client.document;
  const subscriberType = await GfSubscriberType.findByPk(
    client.subscriberTypeId,
  );
  client.marketingConsent = 0;
  client.subscriberType = subscriberType?.aireNetworksCode;

  const documentType = await GfDocumentType.findByPk(client.documentTypeId);

  client.documentType = documentType?.aireNetworksCode || null;

  const contactDocumentType = await GfDocumentType.findByPk(
    client.contactDocumentTypeId,
  );

  client.contactDocumentType = contactDocumentType?.aireNetworksCode || null;

  return client;
};

const buildAireDataFromClient = async function (
  client: GfClient & { subscriberType: number },
): Promise<CreateCustomerParams> {
  const data = {
    subscriberType: client.subscriberType,
    marketingConsent: client.marketingConsent,
    documentType: client.documentType,
    fiscalId: client.fiscalId,
    name: client.name,
    contactName:
      client.subscriberType === 1 ? client.buildFullName() : client.contactName,
    contactFamilyName1:
      client.subscriberType === 1 ? null : client.contactFamilyName1,
    contactFamilyName2:
      client.subscriberType === 1 ? null : client.contactFamilyName2,
    birthday: client.birthday
      ? moment(client.birthday).format('DD/MM/YYYY')
      : null,
    contactDocumentType: Number(client.contactDocumentType),
    contactFiscalId: client.contactFiscalId,
    emailAddress: client.emailAddress,
    contactPhone: client.contactPhone,
    addressRegion: client.addressRegion,
    addressProvince: client.addressProvince,
    addressCity: client.addressCity,
    addressPostalCode: client.addressPostalCode,
    addressStreet: client.addressStreet,
    addressNumber: client.addressNumber,
    nationality: client.nationalityCode,
  } as unknown as CreateCustomerParams;

  if (!client.hasDocument()) return data;

  const [error, object] = await to(
    downloadFile(client.document, GfClient.documentBucket),
  );

  if (error) {
    console.error(error);
    return data;
  }

  data.documento_name = client.document;
  data.documento = object.data.toString('base64');

  return data;
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const downloadDocument = async function (id: number) {
  const client = await GfClient.findByPk(id);
  assert(client, `GfClient with id:${id} was not found`);

  const { data: buffer } = await downloadFile(
    client.document,
    GfClient.documentBucket,
  );

  return { buffer, filename: client.downloadName };
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const uploadDocument = async function (document: any) {
  const validator = new niv.Validator(
    { document: document },
    {
      document: 'required|mime:pdf',
    },
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const { filename } = await uploadFile(GfClient.documentBucket, document);

  return respondCreated({ name: filename });
};

/**
 * @returns niv.Validator
 */
function _validator(body: Record<string, any>, id?: number) {
  niv.bailable(true);
  const attributes = Object.assign({}, body);
  attributes.id = id;
  attributes.emailAddress = body.emailAddress || null;

  const validator = new niv.Validator(
    attributes,
    _validationRules(body.formName, id),
    {
      isClient: 'The clientId not exists',
      clientFiscalIdFormat:
        'The fiscal ID not matched document-type/subscriber-type',
      clientFiscalIdUnique: 'The fiscal ID currently exists',
      clientPhoneNumberUnique: 'The phone number currently exists',
      authorizeIbanChange: 'Changing IBAN is not authorized!',
      checkAddressCode: 'The address code is missing',
    },
  );

  validator.addPostRule(async (provider: Record<string, any>) => {
    if (id && provider.inputs.formName !== 'specifications') {
      return;
    }

    const subscriberType = await GfSubscriberType.findByPk(
      provider.inputs.subscriberTypeId,
    );

    if (!subscriberType) {
      return;
    }

    if (subscriberType.needBusinessName && !provider.inputs.name) {
      provider.error('name', 'custom', 'name can not be empty');
    } else if (!provider.inputs.contactName) {
      provider.error('contactName', 'custom', 'contactName can not be empty');
    } else if (!provider.inputs.contactFamilyName1) {
      provider.error(
        'contactFamilyName1',
        'custom',
        'contactFamilyName1 can not be empty',
      );
    }
  });

  return validator;
}

function _validationRules(formName: string, id?: number) {
  const rules: Record<string, any> = {};
  // specification form validation
  if (!formName || formName === 'activation' || formName === 'specifications') {
    rules.subscriberTypeId = 'requiredIf:active,1|isValidSubscriberType';
    rules.documentTypeId = 'requiredIf:active,1|isValidDocumentType';
    rules.birthday = 'requiredIf:active,1|dateiso';
    rules.fiscalId = 'clientFiscalIdUnique|clientFiscalIdFormat';
  }
  // contact form validation
  if (!formName || formName === 'activation' || formName === 'contact') {
    rules.contactPhone = 'nullable|requiredContactPhone';
    rules.emailAddress = 'nullable|email';
    rules.dontHaveEmail = 'required|in:0,1';
  }
  // contact form validation
  if (!formName || formName === 'activation' || formName === 'address') {
    rules.addressProvince = 'requiredWith:addressCity|checkAddressCode';
    rules.addressCity = 'requiredWith:addressStreet|checkAddressCode';
  }
  // contact form validation
  if (!formName || formName === 'activation' || formName === 'bankData') {
    rules.iban = 'nullable|validateIban|authorizeIbanChange';
    rules.payDay = 'requiredWith:iban,1|between:1,28';
  }

  if (!formName || formName === 'activation' || formName === 'specifications') {
    rules.requiresFacturae = 'nullable|in:0,1,true,false';
    rules.centreCode = 'nullable|string|maxLength:64';
  }

  if (id) {
    rules.formName =
      'required|in:specifications,contact,address,bankData,marketing,activation';
  }

  return rules;
}

/**
 * Get subscriber types indexed by `aireNetworksCode`
 *
 * @return {Promise<any>} [description]
 */
async function _getIndexedSubscriberTypes() {
  const subscriberTypes = await GfSubscriberType.findAll({
    attributes: ['aireNetworksCode', 'id'],
  });

  return _.fromPairs(
    subscriberTypes.map((subscriberType) => {
      return [subscriberType.aireNetworksCode, subscriberType.id];
    }),
  );
}

/**
 * Get document types indexed by `aireNetworksCode`
 *
 * @return {Promise<any>} [description]
 */
async function _getIndexedDocumentTypes() {
  const documentTypes = await GfDocumentType.findAll({
    attributes: ['aireNetworksCode', 'id'],
  });

  return _.fromPairs(
    documentTypes.map((documentType) => {
      return [documentType.aireNetworksCode, documentType.id];
    }),
  );
}

export const getClientByContractId = async (contractId: number) => {
  // @ts-ignore
  return GfClient.findByContractId(contractId);
};

export const generateDocument = async (clientId: number) => {
  const client = await GfClient.findByPk(clientId);
  if (!client) return respondBadRequest('Client not found');

  await ensureOfDocument(client, true);

  return respondSuccess('Document generated.');
};

/**
 * Create docs when a contract is created or updated.
 *
 * @param  {Object} client
 * @return Object
 */
export const ensureOfDocument = async function (
  client: AnyModel,
  force = false,
) {
  if (!force && !client.isActive() && config.isProduction()) {
    return { success: true };
  }

  await Promise.all([
    GfClientSepa.createIfNeeded(client.id),
    GfClientDataProtectionDoc.createIfNeeded(client.id),
  ]);

  return { success: true };
};

export const syncClientToAire = async function (clientId: number) {
  const client = await GfClient.findByPk(clientId);

  if (!client)
    return respondBadRequest(`${GfClient.name} with id:${clientId} not found`);

  await syncToAire(clientId);

  return getGfClientsId(clientId);
};

export const aireToLocal = async function (clientId: number, userId: number) {
  const client = await GfClient.findByPk(clientId);
  assert(client, `${GfClient.name} with id:${clientId} not found`);
  const original = new GfClient(client.get({ plain: true }));
  const results = await SyncClientsWithAire([client]);

  if (results[0].status === 'rejected') {
    throw results[0].reason;
  }

  await ActionEvent.forAction({
    original,
    userId,
    resource: (await GfClient.findByPk(clientId))!,
    action: 'SyncClientsWithAire',
  }).markAsFinished();

  return getGfClientsId(clientId);
};

export const importContracts = async function (
  clientId: number,
  userId: number,
) {
  const client = await GfClient.findByPk(clientId);
  assert(client, `${GfClient.name} with id:${clientId} not found`);
  // first update the caches AIRE cervice lines
  await revisionClient(client.fiscalId, userId);

  return getGfClientsId(clientId);
};

export const checkDiscounts = async function (
  clientId: number,
  userId: number,
) {
  const client = await GfClient.findByPk(clientId);

  assert(
    client,
    new errors.NotFound(`${GfClient.name} with id:${clientId} not found`),
  );

  const result = await updateAllFromClient(
    clientId,
    undefined,
    undefined,
    true,
    userId,
  );

  const reasons = [];
  for (const contractId in result.exclusionReasons) {
    result.exclusionReasons[contractId].forEach((reason) => {
      reasons.push({ ...reason, contractId });
    });
  }

  const ruleId = /ruleId:(?<ruleId>\d+)/;
  const matrixId = /matrixId:(?<matrixId>\d+)/;

  const records = reasons.map((reason) => ({
    ruleId: reason.reason.match(ruleId)?.groups?.ruleId,
    matrixId: reason.reason.match(matrixId)?.groups?.matrixId,
    ...reason,
  }));

  const [contracts, matrices, rules] = await Promise.all([
    GfContract.findAll({
      where: { id: pluck(records, 'contractId').filter(Number) },
      attributes: [
        'reference',
        'id',
        'feeGroupId',
        'clientId',
        'state',
        'type',
      ],
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          attributes: ['id', 'name', 'internalName'],
          include: {
            model: GfSection,
            as: 'sections',
          },
        },
      ],
    }),
    GfDiscountsMatrix.findAll({
      where: { id: pluck(records, 'matrixId').filter(Number) },
    }),
    GfDiscountsMatrixRule.findAll({
      where: { id: pluck(records, 'ruleId').filter(Number) },
    }),
  ]);
  console.error(pluck(records, 'matrixId').filter(Number));
  return respondSuccess(
    records.map((record) => ({
      ...record,
      matrix: matrices.find((matrix) => matrix.id == record.matrixId) ?? null,
      contract:
        contracts.find((contract) => contract.id == record.contractId) ?? null,
      rule: rules.find((rule) => rule.id == record.ruleId) ?? null,
    })),
  );
};

export const setUnpaid = async function (
  clientId: number,
  body: any,
  userId: number,
) {
  const client = await GfClient.findByPk(clientId);

  if (client === null)
    return respondBadRequest(`${GfClient.name} with id:${clientId} not found`);

  const unpaid = await clientUnpaid(
    clientId,
    null,
    body.tpvReference,
    parseFloat(body.total ?? 0),
    parseFloat(body.totalComision ?? 0),
    userId,
    body.reason,
  );

  return unpaid.success
    ? getGfClientsId(clientId)
    : respondWithError({ message: unpaid.reason });
};

export const resumeUnpaid = async function (
  clientId: number,
  userId: number,
  reason: string,
) {
  const client = await GfClient.findByPk(clientId);

  if (client === null)
    return respondBadRequest(`${GfClient.name} with id:${clientId} not found`);

  await clientResume(clientId, null, userId, reason);
  return getGfClientsId(clientId);
};

export const getInvoiceClientsMap = async (filter = {}) => {
  return (await GfClient.findAll({ where: filter })).reduce((acc, client) => {
    acc[client.invoiceClientId] = client.id;
    return acc;
  }, {} as Record<string, number>);
};

export const aireRequestLines = async (clientId: number, userId: number) => {
  const client = await GfClient.findByPk(clientId);

  if (!client) {
    return respondBadRequest(`${GfClient.name} with id:${clientId} not found`);
  }

  if (!client.fiscalId) {
    return respondBadRequest(
      `${GfClient.name} with id:${clientId} has not fiscalId.`,
    );
  }

  const { rows } = await AireRequestLine.paginated(
    {
      page: 1,
      pageSize: 50,
    },
    {
      fiscalId: client.fiscalId,
    },
  );

  return respondSuccess(rows);
};

export const cancelAireRequestLine = async (
  clientId: number,
  body: Record<string, any>,
) => {
  const client = await GfClient.findByPk(clientId);

  if (client === null)
    return respondBadRequest(`${GfClient.name} with id:${clientId} not found`);

  if (!body.code) return respondBadRequest('Aire request code is mandatory.');

  const requestLine = await AireRequestLine.findOne({
    fiscalId: client.fiscalId,
    codigo: body.code,
  });

  if (!requestLine) {
    return respondBadRequest('Invalid request code.');
  }

  await Aire.cancelRequestLine({
    codigo: body.code,
  });

  return getGfClientsId(clientId);
};

export const getClientPhoneNumbersClientId = async (client_id: number) => {
  const client = await GfClient.findByPk(client_id);
  assert(client);
  const contacts = await InvoiceClientsContact.findAll({
    where: {
      clientId: client.invoiceClientId,
    },
  });

  const result = [
    {
      phone: client.contactPhone,
      from: 'gf-clients',
    },
    ...contacts.map((contact) => ({
      phone: contact.phone,
      from: 'invoice-clients-contacts',
    })),
  ];

  return respondSuccess(result);
};

/**
 * @deprecated
 * @param clientId
 * @param query
 * @returns
 */
export const getPersonalDocs = async (
  clientId: number,
  query: Record<string, any>,
) => {
  const response = await getAllEntities(
    query,
    GfDoc,
    { clientId, contractId: -1 },
    [
      {
        model: DocStatus,
        as: 'statuses',
        required: true,
      },
      {
        model: GfClient,
        as: 'client',
      },
    ],
  );

  response.payload.data = response.payload.data.map((gfDoc: AnyModel) => {
    gfDoc = gfDoc.get({ plain: true });
    if (gfDoc.statuses) {
      gfDoc.statuses = gfDoc.statuses.map((docStatus: AnyModel) => {
        return {
          ...docStatus,
          signed: docStatus.signed ? 1 : 0,
          baseDataComplete: docStatus.baseDataComplete ? 1 : 0,
        };
      });
    }
    return gfDoc;
  });

  return response;
};

/**
 * @deprecated WHAT THE HELL IS THIS.
 * @param clientId
 * @param query
 * @returns
 */
export const getContractDocs = async (
  clientId: number,
  query: Record<string, any>,
) => {
  const response = await getAllEntities(query, GfDoc, { clientId }, [
    {
      model: DocStatus,
      as: 'statuses',
      required: true,
    },
    {
      model: GfContract,
      as: 'contract',
      required: true,
      where: { clientId },
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: {
            model: GfSection,
            as: 'sections',
            required: false,
          },
          required: false,
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
        },
        {
          model: GfContractDataTv,
          as: 'dataTv',
          required: false,
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
          include: [
            {
              model: GfContractDataInternet,
              as: 'dataInternet',
              required: false,
            },
          ],
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
          include: [
            {
              model: GfContractDataFix,
              as: 'dataFixes',
              required: false,
            },
          ],
        },
      ],
    },
    {
      model: GfClient,
      as: 'client',
    },
  ]);

  response.payload.data = response.payload.data.map((gfDoc: AnyModel) => {
    gfDoc = gfDoc.get({ plain: true });
    if (gfDoc.statuses) {
      gfDoc.statuses = gfDoc.statuses.map((docStatus: AnyModel) => {
        return {
          ...docStatus,
          signed: docStatus.signed ? 1 : 0,
          baseDataComplete: docStatus.baseDataComplete ? 1 : 0,
        };
      });
    }
    return gfDoc;
  });

  return response;
};
/**
 * @deprecated
 * @param clientId
 * @param query
 * @returns
 */
export const getOtherDocs = async (
  clientId: number,
  query: Record<string, any>,
) => {
  const response = await getAllEntities(
    { ...query, include: true },
    Document,
    {},
    [
      {
        model: GfContractHolderChange,
        required: false,
        where: {
          [Op.or]: [{ fromClientId: clientId }, { toClientId: clientId }],
        },
        include: [
          { model: GfClient, as: 'toClient' },
          { model: GfClient, as: 'fromClient' },
          { model: GfContract, as: 'contract', required: false },
        ],
      },
      {
        model: ChangeBankNumber,
        required: false,
        where: { gf_client_id: clientId },
        include: [{ model: intranet.GfClient, as: 'client' }],
      },
      {
        model: GrantPermission,
        required: false,
        where: { clientId },
        include: [{ model: intranet.GfClient, as: 'client' }],
      },
    ],
    {
      group: ['Document.id'],
      having: literal(
        'COUNT(`GfContractHolderChange`.`id`) > 0 OR COUNT(`ChangeBankNumber`.`id`) > 0 OR COUNT(`GrantPermission`.`id`) > 0',
      ),
      raw: true,
      nest: true,
    },
  );

  response.payload.data = response.payload.data.map((gfDoc) => {
    if (gfDoc.ChangeBankNumber) {
      gfDoc.ChangeBankNumber = {
        ...gfDoc.ChangeBankNumber,
        done: Boolean(gfDoc.ChangeBankNumber.done),
        doc_id: `del:${gfDoc.ChangeBankNumber.doc_id}`,
      };
    }
    return gfDoc;
  });

  return response;
};

export const exportGfClients = async (req, res) => {
  const clients: Record<string, string>[] = [];
  const limit = 500;
  let hasMore = true;
  let offset = 0;
  const implode = (array: string[], joint = ' | ') => {
    return array.filter((item) => item).join(joint);
  };

  while (hasMore) {
    const { rows }: { rows: GfClient[] } = await findAllEntities(
      {
        ...req.query,
        include: -1,
        offset: offset,
        limit,
      },
      GfClient,
      undefined,
      [
        {
          model: InvoiceClientsExtraField,
          as: 'extraFields',
          required: false,
        },
      ],
    );
    rows.forEach((row) => {
      clients.push({
        ID: String(row.id),
        Name: String(row.name),
        Status: row.active ? 'Active' : 'Inactive',
        'Fiscal ID': row.fiscalId,
        'Date Creation': moment(row.creationDate).format('YYYY/MM/DD'),
        'Marketing Tags': implode(pluck(row.extraFields ?? [], 'name')),
      });
    });

    hasMore = rows.length === limit;
    offset += limit;
  }

  const parser = new Parser({
    fields: [
      'ID',
      'Name',
      'Status',
      'Fiscal ID',
      'Date Creation',
      'Marketing Tags',
    ],
  });
  const csv = parser.parse(clients);

  writeFile(res, {
    filename: moment().toLocaleString() + '.csv',
    type: 'attachment',
    buffer: csv,
  });
};
