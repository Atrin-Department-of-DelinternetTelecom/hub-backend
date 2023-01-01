//@ts-check
'use strict';

const { GfFixCallTypes, GfPhonePrefixGroupsXref } = require('@models').intranet;
const { syncMtoN } = require('../../utils/sequelize');

const {
  getAllEntities,
  findAndDeleteIntranet,
  findAndGet,
} = require('@utils/request-handler');
const { respondCreated, respondNotFound } = require('../../utils/response');

/**
 * Your GET endpoint
 * create new GfFixCallTypes
 *
 * returns Object
 **/
exports.createGfFixCallType = async function (body) {
  const fixCallType = await GfFixCallTypes.create(body);

  await syncMtoN(
    GfPhonePrefixGroupsXref,
    'fixCallTypeId',
    fixCallType.id,
    'prefixCode',
    body.code,
  );

  return respondCreated(fixCallType);
};

exports.getGfFixCallTypeById = async function (id) {
  return findAndGet(id, GfFixCallTypes);
};

/**
 * Your GET endpoint
 * get all GfFixCallTypes
 *
 * returns Object
 **/
exports.getGfFixCallTypes = async function (query) {
  return getAllEntities(query, GfFixCallTypes);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateGfFixCallTypes = async function (id, body) {
  const fixCallType = await GfFixCallTypes.findByPk(id);
  if (!fixCallType)
    return respondNotFound(`fix call type with id ${id} not found`);

  await syncMtoN(
    GfPhonePrefixGroupsXref,
    'fixCallTypeId',
    fixCallType.id,
    'prefixCode',
    body.code,
  );

  await fixCallType.update(body);
  return findAndGet(id, GfFixCallTypes);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteGfFixCallTypes = async function (id) {
  return findAndDeleteIntranet(id, GfFixCallTypes);
};
