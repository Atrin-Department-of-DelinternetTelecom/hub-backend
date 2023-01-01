// @ts-check
'use strict';

const { GfContract, GfIvozFix } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDelete,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const { respondBadRequest } = require('@utils/response');

const niv = require('node-input-validator');
const _ = require('lodash');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');

niv.extend('isContract', async ({ value }) => {
  const contract = await GfContract.findByPk(value);

  return contract !== null;
});

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfIvozFixesId = async function (id) {
  return await findAndDelete(id, GfIvozFix);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyGfIvozFixesId = async function (id) {
  return await findAndDeleteIntranet(id, GfIvozFix);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfIvozFixes = async function (query) {
  return await getAllEntities(query, GfIvozFix, undefined, [
    {
      all: true,
      required: false,
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
exports.getGfIvozFixesId = async function (id) {
  return await findAndGet(id, GfIvozFix);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postGfIvozFixes = async function (body) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return createCatch(body, GfIvozFix);
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
exports.putGfIvozFixesId = async function (id, body) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return await findAndUpdate(id, body, GfIvozFix);
};

/**
 * @returns niv.Validator
 */
function _validator(body) {
  return new niv.Validator(
    body,
    {
      email: 'required|email',
      contractId: 'required|isContract',
      // extension: 'required',
      // password: 'required',
      maxInboundCalls: 'required',
      maxCalls: 'required',
      ratingGroup: 'required',
      ring_time: 'required',
      language: 'required|alphaDash',
      type: 'in:residential,home',
    },
    {
      isContract: `${GfContract.name} with id:${body.contractId} not found.`,
    },
  );
}
