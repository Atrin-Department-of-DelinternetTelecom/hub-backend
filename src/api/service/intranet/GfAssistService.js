const {
  intranet: {
    GfAssist,
    GfContractDataInternet,
    GfClient,
    CrTask,
    CrTaskType,
    CrTaskExtraFieldXref,
    CrTaskExtraField,
    CrTaskUserXref,
    CrmUser,
    GfContract,
    GfFeeGroup,
    GfSection,
    GfUser,
  },
  system: { User },
} = require('@models');

const { getAllEntities } = require('@utils/request-handler');

const {
  respondCreated,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const GfSectionService = require('./GfSectionService');

const Crm_AssistsService = require('./Crm_AssistsService');

const moment = require('moment');

const GeoGoufoneService = require('./GeoGoufoneService');

const _ = require('lodash');
const GfContractService = require('./GfContractService');
const CrmTaskService = require('./CrmTaskService');
const assert = require('assert');
const { intranet } = require('@lib/knex');
const TechnicianEvents = require('../technician/Events');
const { TechnicianTask } = require('@api/models/technician/technician_tasks');
const { Op } = require('sequelize');
const { patchToggleCloseGfIncidencesId } = require('./GfIncidenceService');

const { intranet: knexIntranet } = require('@lib/knex');

/**
 *
 * delete a Assistsd String
 * returns Object
 **/
exports.deleteGfAssistsId = async function (id, logedUserId, intranet_userId) {
  const assist = await GfAssist.findByPk(id);
  if (!assist) return respondNotFound(`assists with id ${id} not found`);
  removeEventsRelatedToAssist(assist, logedUserId, intranet_userId);
  assist.status = 0;
  await assist.save();
  return respondSuccess(`assist deleted successfully`);
};

/**
 * remove agendation and assist event related to assist entity
 * @param {Object} assist assist information
 * @param {number} login_user_id id of loged in user
 * @param {number} intranet_user_id intranet id of loged in user
 */
const removeEventsRelatedToAssist = async (
  assist,
  login_user_id,
  intranet_user_id,
) => {
  const assistanceTrace = await exports.getAssistanceTrace(assist);
  const agendationTrace = assistanceTrace.replace(`_assist`, `_agendation`);
  const agendationEvent = await CrTask.findOne({
    where: {
      refererTrace: agendationTrace,
    },
  });

  if (agendationEvent)
    await CrmTaskService.deleteCrmTasksId(
      agendationEvent.id,
      login_user_id,
      intranet_user_id,
    );

  const assistEvent = await CrTask.findOne({
    where: {
      refererTrace: assistanceTrace,
    },
  });
  if (assistEvent)
    await CrmTaskService.deleteCrmTasksId(
      assistEvent.id,
      login_user_id,
      intranet_user_id,
    );
};

/**
 * Your GET endpoint
 * get all Assists record
 *
 * returns Object
 **/
exports.getGfAssists = async function (query) {
  return getAllEntities(query, GfAssist, undefined, [
    {
      model: GfUser,
      as: 'gfUser',
      required: false,
    },
  ]);
};

/**
 * Your GET endpoint
 * get single Assists String
 * returns Object
 **/
exports.getGfAssistsId = async function (id) {
  const assistInstance = await GfAssist.findByPk(id, {
    include: {
      all: true,
      required: false,
    },
  });

  if (!assistInstance) {
    return respondNotFound(`assist with id ${id} not found`);
  }

  const contract = await GfContract.findByPk(assistInstance.contractId);
  if (!contract) {
    return respondNotFound(`contract for assist with id ${id} deleted`);
  }

  const assist = assistInstance.get({ plain: true });

  const assistanceTrace = await exports.getAssistanceTrace(assist);
  const agendationTrace = assistanceTrace.replace(`_assist`, `_agendation`);
  assist.agendation = await CrTask.findOne({
    where: {
      refererTrace: agendationTrace,
    },
    include: {
      model: CrmUser,
      as: 'creator',
      required: false,
    },
  });

  assist.assist = await CrTask.findOne({
    where: {
      refererTrace: assistanceTrace,
    },
    include: {
      model: CrmUser,
      as: 'creator',
      required: false,
    },
  });

  const { lat, lng } = await getContractIdAssistAddress(assist.contractId);
  assist.lat = lat;
  assist.lng = lng;

  return respondSuccess(assist);
};

/**
 *
 * add an Assists
 * returns Object
 **/
exports.postGfAssists = async function (body, creator_id) {
  const { clientId, contractId } = body;
  const client = await GfClient.findByPk(clientId);
  if (!client) return respondNotFound(`client with id ${clientId} not found`);
  const contract = await GfContract.findByPk(contractId);
  if (!contract)
    return respondNotFound(`contract with id ${contractId} not found`);
  if (body.previsionDate) {
    body.previsionDate = new Date(body.previsionDate);
  }
  body.executedDate = body.closed
    ? body.executedDate
      ? new Date(body.executedDate)
      : new Date()
    : undefined;

  body.duration = body.duration ? body.duration : 60;
  body.sectionCode = await GfSectionService.getContractSectionCode(
    body.contractId,
  );
  body.createdByUserId = creator_id;
  const newAssist = await GfAssist.create(body);
  await Crm_AssistsService.newAssistance(newAssist, creator_id, 'assist');
  await syncCoWorkers(newAssist, body);

  const assistanceTrace = await exports.getAssistanceTrace(newAssist);
  const agendationTrace = assistanceTrace.replace(`_assist`, `_agendation`);
  let mainEvent = await getAssistEventBasedOnTrace(assistanceTrace);
  if (!mainEvent) {
    mainEvent = await getAssistEventBasedOnTrace(agendationTrace);
  }
  return respondCreated({
    ...newAssist.get({ plain: true }),
    event: mainEvent,
  });
};

const getAssistEventBasedOnTrace = async (trace) => {
  return CrTask.findOne({
    where: {
      refererTrace: trace,
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
};

/**
 *
 * update an assists String
 * returns Object
 **/
exports.putGfAssistsId = async function (id, body, user) {
  const assist = await GfAssist.findByPk(id);
  if (!assist) return respondNotFound(`assist with id ${id} not found`);

  if (body.previsionDate)
    body.previsionDate = moment(body.previsionDate).format(
      'YYYY-MM-DD HH:mm:ss',
    );

  body.executedDate = body.closed
    ? body.executedDate
      ? moment(body.executedDate).format('YYYY-MM-DD HH:mm:ss')
      : moment().format('YYYY-MM-DD HH:mm:ss')
    : undefined;

  if (!body.closed) delete body.executedDate;

  body.duration = body.duration ? body.duration : 60;

  const oldAssist = assist.toJSON();

  await assist.update(body);
  await syncCoWorkers(assist, body);
  await Crm_AssistsService.assistanceUpdated(assist, user.userId, 'assist');
  await syncTechnicianTask(oldAssist, assist, {
    globalUserId: user.id,
    intranetUserId: user.userId,
  });
  return exports.getGfAssistsId(id);
};

const syncCoWorkers = async (assist, { coWorkers }) => {
  if (!Array.isArray(coWorkers)) {
    return;
  }

  await knexIntranet
    .table('gf_assist_co_workers')
    .where('gf_assist_id', assist.id)
    .delete();

  if (coWorkers.length) {
    const rows = coWorkers.map((userId) => ({
      user_id: userId,
      gf_assist_id: assist.id,
    }));
    // insert to database
    await knexIntranet.table('gf_assist_co_workers').insert(rows);
  }
};

exports.patchCancelGfAssistsId = async function (
  id,
  { reasonId, description },
  user,
) {
  const assist = await GfAssist.findByPk(id, {
    include: [{ model: User, as: 'global_gf_user' }],
  });

  if (!assist) return respondNotFound(`assist with id ${id} not found`);
  assist.closed = 1;
  assist.executedDate = moment().format('YYYY-MM-DD HH:mm:ss');

  await assist.save();

  const technicianTasks = await TechnicianTask.findAll({
    where: {
      type: 'incidence/assistance',
      typeId: id,
      cancelledBy: { [Op.or]: [{ [Op.ne]: 'operator' }, { [Op.is]: null }] },
    },
  });

  const tasksGroupByState = _.groupBy(technicianTasks, 'state');
  const inProgressTasks = tasksGroupByState?.in_progress?.[0];
  const cancelledTasks = tasksGroupByState?.cancelled ?? [];

  if (inProgressTasks)
    inProgressTasks.update({
      cancelledBy: 'operator',
      cancelReasonId: reasonId,
      cancelReasonDescription: description,
      state: 'cancelled',
      cancelledById: user.id,
      cancelledAt: new Date(),
    });

  if (cancelledTasks.length)
    await TechnicianTask.update(
      {
        cancelledBy: 'operator',
        cancelledById: user.id,
        cancelledAt: new Date(),
      },
      {
        where: {
          id: cancelledTasks.map((cancelledTask) => cancelledTask.id),
        },
      },
    );

  await Crm_AssistsService.assistanceUpdated(
    assist,
    user.userId,
    'assist',
    'cancel',
  );
  return respondSuccess(assist);
};

/**
 *
 * @param {number} id
 * @param {number} userId
 */
exports.setAsDone = async (id, userId) => {
  const assist = await GfAssist.findByPk(id);
  assert(assist, `Assist with id:${id} not found`);
  await assist.update({
    executedDate: new Date(),
    closed: true,
  });
  await Crm_AssistsService.assistanceUpdated(assist, userId, 'assist');

  if (assist.incidenceId) {
    const hasOpenedAssist = (
      await GfAssist.findAll({
        where: { incidenceId: assist.incidenceId, closed: false },
      })
    ).length
      ? true
      : false;

    if (!hasOpenedAssist)
      await patchToggleCloseGfIncidencesId(assist.incidenceId, {
        comeFrom: 'assist',
      });
  }
};

exports.getAssistanceTrace = async (assistance) => {
  const sectionType = await GfSectionService.getContractSectionCode(
    assistance.contractId,
  );

  let key = '';
  if (sectionType === 'INTERNET') {
    const condition = await GfContractService.getActualConditionsBySection(
      assistance.contractId,
    );
    const technology = condition.internetTechnology;
    key = `assist_assist/${technology}_${assistance.id}_${sectionType}`;
  } else {
    key = `assist_assist_${assistance.id}_${sectionType}`;
  }

  return key;
};

const getContractIdAssistAddress = async (contractId) => {
  const contract = await GfContract.findByPk(contractId, {
    include: { model: GfClient, as: 'client' },
  });

  if (!contract) {
    throw new Error(`contract with id ${contractId} not found`);
  }

  const nullAddress = { lat: null, lng: null };

  const type = await GfSectionService.getContractSectionCode(contractId);
  const section = await GfSectionService.getContractSection(contractId, type);

  if (type === 'INTERNET') {
    if (!section) return nullAddress;

    return {
      lat: section?.addressLat,
      lng: section?.addressLng,
      address: GeoGoufoneService.getFormatedAddress(section, true).html.replace(
        /<br>/g,
        ' ',
      ),
    };
  }

  if (type === 'FIX') {
    if (!section?.internetSectionId) return nullAddress;

    const internetSection = await GfContractDataInternet.findOne({
      where: {
        contractId: section.internetSectionId,
      },
    });

    if (!internetSection) return nullAddress;

    return {
      lat: internetSection.addressLat,
      lng: internetSection.addressLng,
      address: GeoGoufoneService.getFormatedAddress(
        internetSection,
        true,
      ).html.replace(/<br>/g, ' '),
    };
  }

  return {
    lat: contract.client.addressLat,
    lng: contract.client.addressLng,
    address: GeoGoufoneService.getFormatedAddress(
      contract.client,
      true,
    ).html.replace(/<br>/g, ' '),
  };
};

exports.getAssistsAddress = async (contractId) => {
  try {
    const result = await getContractIdAssistAddress(contractId);
    return respondSuccess(result);
  } catch (e) {
    return respondNotFound(e.message);
  }
};

/**
 *
 * @param {string} str
 * @returns {string | null}
 */
function formatPhone(str) {
  const regex = /\b\d{9}\b|\b\d{11}\b/g;
  const [match] = (str || '').match(regex) || [];

  if (!match) return null;
  if (match.length === 11 && !match.startsWith('0')) return match;
  if (match.length === 9) return `34${match}`;
  return null;
}

exports.formatContactPhones = async () => {
  const rows = await intranet('gf_assists')
    .select('id', 'contactPhone', 'malformedContactPhone')
    .whereNotNull('contactPhone')
    .whereNull('malformedContactPhone');

  for (const { id, contactPhone } of rows) {
    await intranet('gf_assists')
      .update({
        contactPhone: formatPhone(contactPhone),
        malformedContactPhone: contactPhone,
      })
      .where({
        id,
      });
  }
};

/**
 *  gfUserId, previsionDate
 * @param {AnyModel} oldEntity
 * @param {AnyModel} newEntity
 * @param {{globalUserId:number; intranetUserId:number}} newEntity
 */
const syncTechnicianTask = async (
  oldEntity,
  newEntity,
  { globalUserId, intranetUserId },
) => {
  const hasTechnicianChanged = oldEntity.gfUserId !== newEntity.gfUserId;

  const hasPrevisionDateChanged = !moment(oldEntity.previsionDate).isSame(
    newEntity.previsionDate,
  );

  if (hasPrevisionDateChanged || hasTechnicianChanged) {
    await TechnicianEvents.onAssistanceDateChanged(newEntity, {
      globalUserId,
      intranetUserId,
    });
  }
};

exports.patchToggleCloseGfAssistsId = async function (id, login_user_id) {
  const assist = await GfAssist.findByPk(id);
  if (!assist) return respondNotFound(`assist with id ${id} not found`);

  assist.closed = !assist.closed;

  assist.executedDate = null;
  if (assist.closed)
    assist.executedDate = moment().format('YYYY-MM-DD HH:mm:ss');

  await assist.save();
  await Crm_AssistsService.assistanceUpdated(assist, login_user_id, 'assist');
  return respondSuccess(assist);
};
