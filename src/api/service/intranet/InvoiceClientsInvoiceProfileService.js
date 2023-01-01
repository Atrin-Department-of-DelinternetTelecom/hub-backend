//@ts-check
'use strict';

const {
  intranet: {
    GfClient,
    InvoiceClientsInvoiceProfile,
    InvoicePaymentType,
    GfContract,
  },
} = require('@models');
const requestHandler = require('@utils/request-handler');
const { respondBadRequest, respondNotFound } = require('@utils/response');

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteInvoiceClientsInvoiceProfilesId = async function (id) {
  await exports.beforeDelete(id);
  return requestHandler.findAndDelete(id, InvoiceClientsInvoiceProfile);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyInvoiceClientsInvoiceProfilesId = async function (id) {
  exports.beforeSoftDelete(id);
  return requestHandler.findAndDeleteIntranet(id, InvoiceClientsInvoiceProfile);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getInvoiceClientsInvoiceProfiles = async function (query) {
  return requestHandler.getAllEntities(query, InvoiceClientsInvoiceProfile);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getInvoiceClientsInvoiceProfilesId = async function (id) {
  return requestHandler.findAndGet(id, InvoiceClientsInvoiceProfile);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postInvoiceClientsInvoiceProfiles = async function (body) {
  const invoiceClientId = body.clientId;

  const client = await GfClient.findOne({
    where: { invoiceClientId },
  });

  if (!client) {
    return respondNotFound(`GfClient with invoiceClientId=${invoiceClientId}`);
  }

  if (body.payTypeId && !(await InvoicePaymentType.findByPk(body.payTypeId))) {
    return respondBadRequest('Invalid payment type');
  }

  return requestHandler.createCatch(body, InvoiceClientsInvoiceProfile);
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
exports.putInvoiceClientsInvoiceProfilesId = async function (id, body) {
  const invoiceClientId = body.clientId;
  const client = await GfClient.findOne({
    where: { invoiceClientId },
  });

  if (!client) {
    return respondNotFound(`GfClient with invoiceClientId=${invoiceClientId}`);
  }

  if (body.payTypeId && !(await InvoicePaymentType.findByPk(body.payTypeId))) {
    return respondBadRequest('Invalid payment type');
  }

  return requestHandler.findAndUpdate(id, body, InvoiceClientsInvoiceProfile);
};

exports.beforeSoftDelete = async (id) => {
  await GfContract.update(
    { invoiceProfileId: null },
    { where: { invoiceProfileId: id } },
  );
};
exports.beforeDelete = async (id) => {
  await GfContract.update(
    { invoiceProfileId: null },
    { where: { invoiceProfileId: id } },
  );
};
