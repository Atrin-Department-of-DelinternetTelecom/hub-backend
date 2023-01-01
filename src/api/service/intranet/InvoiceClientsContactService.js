//@ts-check
'use strict';

const { InvoiceClient, InvoiceClientsContact } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const fileService = require('@api/service/file/fileService');

const niv = require('node-input-validator');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');
const { default: to } = require('await-to-js');

niv.extend('isClient', async ({ value }) => {
  return (
    (await InvoiceClient.findOne({
      where: {
        id: value,
      },
    })) !== null
  );
});

niv.extend('imageExist', async ({ value }) => {
  if (value) {
    const [error] = await to(fileService.downloadFile(value, 'client-contact'));
    return error ? false : true;
  }
  return true;
});

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteInvoiceClientsContactsId = async function (id) {
  return await findAndDelete(id, InvoiceClientsContact);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceClientsContactsId = async function (id) {
  return await findAndDeleteIntranet(id, InvoiceClientsContact);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceClientsContacts = async function (query) {
  return await getAllEntities(query, InvoiceClientsContact);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceClientsContactsId = async function (id) {
  return await findAndGet(id, InvoiceClientsContact);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceClientsContacts = async function (body) {
  const validator = _validator(body);
  ValidationException.throwUnless(await validator.check(), validator.errors);
  return createCatch(body, InvoiceClientsContact);
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
exports.putInvoiceClientsContactsId = async function (id, body) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return await findAndUpdate(id, body, InvoiceClientsContact);
};

function _validator(body) {
  body.email = body.email ? body.email : null;

  return new niv.Validator(
    body,
    {
      name: 'required|minLength:1',
      email: 'nullable|email',
      clientId: 'isClient',
      image: 'imageExist',
    },
    {
      isClient: `invoice client with id:${body.clientId} not found`,
      imageExist: `image not found`,
    },
  );
}
