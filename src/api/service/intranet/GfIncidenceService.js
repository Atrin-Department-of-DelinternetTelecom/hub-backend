// @ts-check
'use strict';

const {
  intranet: {
    GfIncidence,
    CrTask,
    CrTaskExtraField,
    CrmUser,
    GfContract,
    GfFeeGroup,
    GfSection,
    GfContractDataCell,
    GfContractDataInternet,
    GfContractDataFix,
    GfClient,
    GfAssist,
    GfUser,
    CrTaskExtraFieldXref,
    CrTaskUserXref,
    CrTaskType,
  },
  system: { User },
} = require('@models');

const { getAllEntities } = require('@utils/request-handler');

const GfSectionService = require('./GfSectionService');

const CrmTaskService = require('./CrmTaskService');

const { newIncidence, incidenceUpdated } = require('./Crm_IncidenceService');

const { getIncidenceTrace } = require('./Incidences_GfIncidencesService');
const {
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const moment = require('moment');

const { modelToJson } = require('@utils/tools');

const { errors } = require('@api/http/http_errors');
const { Op } = require('sequelize');
const GfAssistService = require('./GfAssistService');

/**
 *
 * delete a Incidences String
 * returns Object
 **/
exports.deleteGfIncidencesId = async function (
  id,
  logedUserId,
  intranetUserId,
) {
  const incidence = await GfIncidence.findByPk(id);
  if (!incidence) return respondNotFound(`incidence with id ${id} not found`);

  const type = await GfSectionService.getContractSectionCode(
    incidence.contractId,
  );
  const refererTrace = await getIncidenceTrace(incidence, type);
  const relatedTask = await CrTask.findOne({
    where: {
      refererTrace,
    },
  });
  if (relatedTask)
    await CrmTaskService.deleteCrmTasksId(
      relatedTask.id,
      logedUserId,
      intranetUserId,
    );
  incidence.status = 0;
  await incidence.save();
  return respondSuccess(`incidence with id ${id} successfuly deleted.`);
};

/**
 * Your GET endpoint
 * get all Incidences record
 *
 * returns Object
 **/
exports.getGfIncidences = async function (query) {
  return getAllEntities(query, GfIncidence, undefined, [
    { model: GfClient, as: 'client' },
    { model: GfContract, as: 'contract' },
    { model: User, as: 'creator' },
    { model: GfAssist, as: 'assists', required: false },
  ]);
};

/**
 * Your GET endpoint
 * get single incidence String
 * returns Object
 **/
exports.getGfIncidencesId = async function (id) {
  const incidence = await GfIncidence.findByPk(id, {
    include: [
      {
        model: GfClient,
        as: 'client',
        required: false,
      },
      {
        model: CrTask,
        as: 'mother_event',
        required: false,
      },
      { model: User, as: 'creator' },
      {
        model: GfAssist,
        as: 'assists',
        include: [
          {
            model: GfUser,
            as: 'gfUser',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: GfContract,
        as: 'contract',
        required: false,
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: [
              {
                model: GfSection,
                as: 'sections',
                required: false,
              },
            ],
            required: false,
          },
          {
            model: GfContractDataCell,
            as: 'dataCell',
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
          {
            model: GfContract,
            as: 'linkedContract',
            required: false,
          },
        ],
      },
    ],
  });
  if (!incidence) {
    return respondNotFound(`incidence with id ${id} not found`);
  }
  const type = await GfSectionService.getContractSectionCode(
    incidence.contractId,
  );
  const refererTrace = await getIncidenceTrace(incidence, type);
  const event = await CrTask.findOne({
    where: {
      refererTrace,
    },
    include: [
      {
        model: CrTaskExtraFieldXref,
        as: 'extra_fields',
        include: [
          {
            model: CrTaskExtraField,
            as: 'extra_field',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: CrTaskUserXref,
        as: 'users',
        include: [
          {
            model: CrmUser,
            as: 'user',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: CrmUser,
        as: 'creator',
        required: false,
      },
      {
        model: User,
        as: 'system_user',
        required: false,
      },
    ],
  });

  return respondSuccess({
    ...modelToJson(incidence),
    event: modelToJson(event),
  });
};

/**
 *
 * add an incidence
 * returns Object
 **/
exports.postGfIncidences = async function (body, creator_id) {
  const incidecneData = await normalizeData(body);
  incidecneData.userId = creator_id;
  const newIncidenceModel = await GfIncidence.create(incidecneData);
  await newIncidence(newIncidenceModel, creator_id);
  const type = await GfSectionService.getContractSectionCode(
    newIncidenceModel.contractId,
  );
  const refererTrace = await getIncidenceTrace(newIncidenceModel, type);
  const event = await CrTask.findOne({
    where: {
      refererTrace,
    },
    include: [
      {
        model: CrTaskType,
        as: 'task_type',
        required: false,
      },
      {
        model: CrTaskExtraFieldXref,
        as: 'extra_fields',
        include: [
          {
            model: CrTaskExtraField,
            as: 'extra_field',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: CrTaskUserXref,
        as: 'users',
        include: [
          {
            model: CrmUser,
            as: 'user',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
      },
      {
        model: GfContract,
        as: 'contract',
        required: false,
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: [
              {
                model: GfSection,
                as: 'sections',
                required: false,
              },
            ],
            required: false,
          },
        ],
      },
    ],
  });
  await incidenceUpdated(newIncidenceModel);
  return respondCreated({
    ...newIncidenceModel.get({ plain: true }),
    event,
  });
};

/**
 *
 * update an incidence String
 * returns Object
 **/
exports.putGfIncidencesId = async function (id, body) {
  const incidence = await GfIncidence.findByPk(id, {
    include: [
      { model: GfClient, as: 'client' },
      { model: GfContract, as: 'contract' },
      { model: User, as: 'creator' },
    ],
  });
  if (!incidence)
    throw new errors.NotFound(`incidence with id ${id} not found`);

  if (body.closed === false && incidence.closed === true)
    throw new errors.BadRequest(`incidence with id ${id} already closed`);

  const normalizedData = await normalizeData(body);
  await incidence.update(normalizedData);
  await incidenceUpdated(incidence);
  return respondSuccess(incidence);
};

/**
 * close incidence and its related assist
 * @param {number} id
 * @param {{reasonId?:number;description?:string;comeFrom:string}} param1
 * @param {{userId:number}} user
 */
exports.patchToggleCloseGfIncidencesId = async function (
  id,
  { comeFrom, reasonId, description },
  user,
) {
  const incidence = await GfIncidence.findByPk(id, {
    include: [
      { model: GfClient, as: 'client' },
      { model: GfContract, as: 'contract' },
      { model: User, as: 'creator' },
    ],
  });
  if (!incidence)
    throw new errors.NotFound(`incidence with id ${id} not found`);

  if (incidence.closed)
    throw new errors.BadRequest(`incidence with id ${id} already closed`);

  incidence.closed = true;
  await normalizeData(incidence);
  await incidence.save();
  await incidenceUpdated(incidence);
  await exports.closeAssistsOfIncidence(
    id,
    { comeFrom, reasonId, description },
    user,
  );
  return respondSuccess(incidence);
};

const normalizeData = async (incidence) => {
  incidence.executedDate = incidence.closed
    ? incidence.executedDate
      ? incidence.executedDate
      : moment().format('YYYY-MM-DD HH:mm:ss')
    : null;
  incidence.sectionCode = await GfSectionService.getContractSectionCode(
    incidence.contractId,
  );
  return incidence;
};

exports.closeOpenIncidencesWithSuspendedContracts = async function (
  userId,
  exceptedIds,
) {
  const openIncidencesWithSuspendedContracts = await GfIncidence.findAll({
    where: {
      closed: false,
      userId,
      id: { [Op.notIn]: exceptedIds },
    },
    include: [{ model: GfContract, as: 'contract' }],
  });
  for (const incidence of openIncidencesWithSuspendedContracts) {
    console.log('incidence id:', incidence.id);
    incidence.closed = 1;
    incidence.executedDate = moment().format('YYYY-MM-DD HH:mm:ss');

    await incidence.save();
    await incidenceUpdated(incidence);
  }
  return respondSuccess('suspended incidences are closed');
};

/**
 * close assists and its technician tasks if exist
 * @param {number} incidenceId
 * @param {{reasonId?:number;description?:string;comeFrom:string}} param1
 * @param {{userId:number}} user
 */
exports.closeAssistsOfIncidence = async function (
  incidenceId,
  { comeFrom, reasonId, description },
  user,
) {
  // Check if comeFrom is 'incidence' and if reasonId is provided
  if (comeFrom === 'incidence' && reasonId !== undefined) {
    const assists = await GfAssist.findAll({
      where: { incidenceId, closed: false },
    });

    for (const assist of assists) {
      await GfAssistService.patchCancelGfAssistsId(
        assist.id,
        { reasonId, description },
        user,
      );
    }
  }
};
