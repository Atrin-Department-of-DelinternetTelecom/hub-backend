'use strict';

const {
  GfCrmEvent,
  GfCrmEventExtraField,
  GfCrmEventUserXref,
  GfCrmEventClientTag,
  CrTaskType,
  GfCollaborator,
  InvoiceClientsExtraField,
  GfUser,
  CrTaskExtraField,
} = require('@models').intranet;

const {
  getAllEntities,
  findAndGet,
  findAndUpdate,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const { respondCreated, respondNotFound } = require('@utils/response');

const { syncMtoN } = require('../../utils/sequelize');

const getRelationShips = () => [
  {
    model: CrTaskType,
    as: 'taskType',
    required: false,
  },
  {
    model: GfCollaborator,
    as: 'collaborator',
    required: false,
  },
  {
    model: InvoiceClientsExtraField,
    as: 'clientTags',
    required: false,
  },
  {
    model: GfUser,
    as: 'users',
    required: false,
  },
  {
    model: CrTaskExtraField,
    as: 'crmExtraFields',
    required: false,
  },
];

/**
 * Your GET endpoint
 * create new crm event record
 *
 * returns Object
 **/
exports.createGfCrmEvent = async function (body) {
  const crmEvent = await GfCrmEvent.create(body);
  await syncXrefsOfCrmEvent(body, crmEvent.id);
  return respondCreated(
    await GfCrmEvent.findByPk(crmEvent.id, { include: getRelationShips() }),
  );
};

/**
 * sync all xref(MtoN) related event
 * @param {{labels:Array<number>,users:Array<number>,clientTags:Array<number>,}} xrefs
 * @param {number} crmEventId
 */
const syncXrefsOfCrmEvent = async (xrefs, crmEventId) => {
  await syncMtoN(
    GfCrmEventExtraField,
    'gfCrmEventId',
    crmEventId,
    'crmExtraFieldId',
    xrefs.labels,
  );

  await syncMtoN(
    GfCrmEventUserXref,
    'gfCrmEventId',
    crmEventId,
    'userId',
    xrefs.users,
  );

  await syncMtoN(
    GfCrmEventClientTag,
    'crmEventId',
    crmEventId,
    'extraFieldId',
    xrefs.clientTags,
  );
};

/**
 * Your GET endpoint
 * get all crm event (information) record
 *
 * returns Object
 **/
exports.getGfCrmEvents = async function (query) {
  return getAllEntities(query, GfCrmEvent, undefined, getRelationShips());
};

/**
 * Your GET endpoint
 * get single crm event label record by id
 *
 * id String
 * returns Object
 **/
exports.getGfCrmEventId = async function (id) {
  return findAndGet(id, GfCrmEvent, getRelationShips());
};

/**
 * Your GET endpoint
 * update single crm event lable record by id
 *
 * returns Object
 **/
exports.updateGfCrmEvent = async function (id, body) {
  const crmEvent = await GfCrmEvent.findByPk(id);
  if (!crmEvent) return respondNotFound(`crm event with id ${id} not found`);
  await syncXrefsOfCrmEvent(body, id);
  return findAndUpdate(id, body, GfCrmEvent);
};

/**
 * Your GET endpoint
 * delete single crm event label record by id
 *
 * returns Object
 **/
exports.deleteGfCrmEvent = async function (id) {
  const crmEvent = await GfCrmEvent.findByPk(id);
  if (!crmEvent) return respondNotFound(`crm event with id ${id} not found`);
  await syncXrefsOfCrmEvent({ labels: [], users: [], clientTags: [] }, id);
  return findAndDeleteIntranet(id, GfCrmEvent);
};
