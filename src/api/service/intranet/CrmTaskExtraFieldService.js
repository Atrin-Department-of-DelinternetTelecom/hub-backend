'use strict';

const { CrTaskExtraField } = require('@models').intranet;

const {
  getAllEntities,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const {
  respondCreated,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

/**
 * Your GET endpoint
 * get all crm task extra fields record
 *
 * returns Object
 **/
exports.getCrmTaskExtraFields = async function (query) {
  return await getAllEntities(query, CrTaskExtraField, undefined, []);
};

exports.postCrmTaskExtraFields = async function (body) {
  return respondCreated(await CrTaskExtraField.create(body));
};

exports.getCrmTaskExtraFieldsId = async function (id) {
  const crTaskExtraField = await CrTaskExtraField.findByPk(id);
  if (!crTaskExtraField)
    return respondNotFound(`extra field with id ${id} not found`);
  return respondSuccess(crTaskExtraField);
};

exports.putCrmTaskExtraFieldsId = async function (id, body) {
  const crTaskExtraField = await CrTaskExtraField.findByPk(id);
  if (!crTaskExtraField)
    return respondNotFound(`extra field with id ${id} not found`);
  await crTaskExtraField.update(body);
  return respondSuccess(crTaskExtraField);
};

exports.deleteCrmTaskExtraFieldsId = async function (id) {
  return await findAndDeleteIntranet(id, CrTaskExtraField);
};
