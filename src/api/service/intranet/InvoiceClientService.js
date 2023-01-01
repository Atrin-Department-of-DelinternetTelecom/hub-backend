//@ts-check
'use strict';

const {
  intranet: {
    InvoiceClient,
    InvoiceClientUserXref,
    GfUser,
    InvoiceClientExtraFieldXref,
    InvoiceClientsExtraField,
    Country,
    GfClient,
    GfCollaborator,
  },
} = require('@models');

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const { respondNotFound, respondOK } = require('@utils/response');

const { validateSpanishId, spainIdType } = require('spain-id');

const niv = require('node-input-validator');
const { syncMtoN } = require('@utils/sequelize');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');
const assert = require('assert');
const { Op, col } = require('sequelize');

niv.extend('spanishId', ({ value }) => {
  return spainIdType(value) ? validateSpanishId(value) : true;
});

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteInvoiceClientsId = async function (id) {
  return findAndDelete(id, InvoiceClient);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceClientsId = async function (id) {
  return findAndDeleteIntranet(id, InvoiceClient);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceClients = async function (query) {
  return getAllEntities(query, InvoiceClient, undefined, [
    {
      model: InvoiceClientExtraFieldXref,
      as: 'extraFields',
      required: false,
      include: {
        model: InvoiceClientsExtraField,
        as: 'extraField',
        required: false,
      },
    },
    {
      model: InvoiceClientUserXref,
      as: 'users',
      required: false,
      include: {
        model: GfUser,
        as: 'user',
        required: false,
      },
    },
    {
      model: Country,
      as: 'country',
      required: false,
    },
    {
      model: GfClient,
      as: 'client',
      required: false,
      include: {
        model: GfCollaborator,
        as: 'collaborator',
        required: false,
      },
    },
  ]);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceClientsId = async function (id) {
  return findAndGet(id, InvoiceClient, [
    {
      model: InvoiceClientExtraFieldXref,
      as: 'extraFields',
      required: false,
      include: {
        model: InvoiceClientsExtraField,
        as: 'extraField',
        required: false,
      },
    },
    {
      model: InvoiceClientUserXref,
      as: 'users',
      required: false,
      attributes: ['id', 'userId', 'clientId'],
      include: {
        model: GfUser,
        as: 'user',
        required: false,
        attributes: ['id', 'userId', 'name', 'email'],
      },
    },
    {
      model: Country,
      as: 'country',
      required: false,
    },
    {
      model: GfClient,
      as: 'client',
      required: false,
      include: {
        model: GfCollaborator,
        as: 'collaborator',
        required: false,
      },
    },
  ]);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceClients = async function (body) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return createCatch(body, InvoiceClient).then(async (response) => {
    if (response.code !== 201) return response;

    for (const user of body.users ?? []) {
      await InvoiceClientUserXref.create({
        userId: user,
        clientId: response.payload.data.id,
        status: 1,
      });
    }

    for (const e of body.extraFields ?? []) {
      await InvoiceClientExtraFieldXref.create({
        extraFieldId: e,
        clientId: response.payload.data.id,
        status: 1,
      });
    }

    return response;
  });
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
exports.putInvoiceClientsId = async function (id, body) {
  const validator = _validator(body);
  const model = await InvoiceClient.findByPk(id);

  if (!model)
    return respondNotFound(`${InvoiceClient.name} with id:${id} was not found`);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  await syncMtoN(InvoiceClientUserXref, 'clientId', id, 'userId', body.users);
  await syncMtoN(
    InvoiceClientExtraFieldXref,
    'clientId',
    id,
    'extraFieldId',
    body.extraFields,
  );

  await InvoiceClient.update(body, { where: { id } });

  return findAndGet(id, InvoiceClient, [
    {
      model: InvoiceClientExtraFieldXref,
      as: 'extraFields',
      required: false,
      include: {
        model: InvoiceClientsExtraField,
        as: 'extraField',
        required: false,
      },
    },
    {
      model: InvoiceClientUserXref,
      as: 'users',
      required: false,
      attributes: ['id', 'userId', 'clientId'],
      include: {
        model: GfUser,
        as: 'user',
        required: false,
        attributes: ['id', 'userId', 'name', 'email'],
      },
    },
    {
      model: Country,
      as: 'country',
      required: false,
    },
  ]);
};

/**
 * @returns niv.Validator
 */
function _validator(body) {
  return new niv.Validator(
    body,
    {
      name: 'required',
      gender: 'required|in:male,female',
      businessName: 'requiredIf:isBusiness,1',
      nif: 'spanishId',
    },
    {
      spanishId: 'The NIF is invalid',
    },
  );
}

/**
 *  get client id and return formatted address based on data in invoice_client entity
 * @param {number} clientId
 * @returns {Promise<string>}
 */
exports.getClientFormattedAddress = async (clientId) => {
  const invoice_client = await InvoiceClient.findByPk(clientId);
  assert(invoice_client, `invoice client with id ${clientId} not found`);

  const line1 = `${invoice_client.address ?? ''} ${
    invoice_client.number ?? ''
  }`.trim();

  const line2 = `${invoice_client.postalCode ?? ''} ${
    invoice_client.city ?? ''
  }`.trim();

  const line3 = (invoice_client.state ?? '').trim();

  return `${line1} ${line2 ? `<br>${line2} ` : ''}${
    line3 ? `<br>${line3} ` : ''
  }`;
};

/**
 *  get name of client to present based on isBusiness in client
 * @param {{
 *  isBusiness:boolean,
 *  businessName:string,
 *  name:string,
 *  surname1:string,
 *  surname2:string
 * }} client
 * @returns {string}
 */
exports.getStringName = (client) => {
  return client.isBusiness
    ? client.businessName
    : `${client.name ?? ''} ${client.surname1 ?? ''} ${client.surname2 ?? ''}`;
};

exports.syncInvoiceClientWithGfClient = async () => {
  const invoiceClients = await InvoiceClient.findAll({
    include: [
      {
        model: GfClient,
        as: 'client',
        required: true,
      },
    ],
    where: {
      [Op.or]: [
        {
          address: { [Op.regexp]: '[0-9]$' },
        },
        {
          [Op.or]: [
            {
              '$client.addressNumber$': {
                [Op.ne]: col('InvoiceClient.number'),
              },
            },
            {
              '$client.addressStreet$': {
                [Op.ne]: col('InvoiceClient.address'),
              },
            },
          ],
        },
      ],
    },
    group: ['InvoiceClient.id'],
  });

  for (const invoiceClient of invoiceClients) {
    const gfClient = invoiceClient.client;

    if (
      invoiceClient.address !== gfClient.addressStreet ||
      invoiceClient.number !== gfClient.addressNumber
    ) {
      invoiceClient.address = gfClient.addressStreet;
      invoiceClient.number = gfClient.addressNumber;

      await invoiceClient.save();
    }
  }

  return respondOK('Invoice client synced with Gf client');
};
