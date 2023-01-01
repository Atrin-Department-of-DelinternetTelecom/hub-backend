'use strict';

const { CrTaskType, CrmTaskTypeSon } = require('@models').intranet;

const {
  respondCreated,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const {
  getAllEntities,
  findAndGet,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

exports.createCrTaskType = async function (body) {
  const { sons } = body;

  //check sons Id validation
  if (!(await isValidSons(sons))) {
    return respondNotFound(`invalid sons id`);
  }

  //create new task type
  const newCrmTaskType = await CrTaskType.create(body);

  //attach sons to newTaskType(father)
  await attachSonsTofather(newCrmTaskType, sons);

  return respondCreated(
    await CrTaskType.findByPk(newCrmTaskType.id, {
      include: {
        model: CrTaskType,
        as: 'sons',
        required: false,
      },
    }),
  );
};

/**
 * check crTaskIds is valid or no
 * @param {Array} sons ids of crTaskType
 * @returns {boolean}
 */
const isValidSons = async (sons) => {
  if (sons && Array.isArray(sons)) {
    const sonsNumber = await CrTaskType.count({
      where: {
        id: sons,
      },
    });
    return sonsNumber === sons.length ? true : false;
  }
  return true;
};

/**
 * attach sons to father
 * @param {Object} taskType current task type (father)
 * @param {Array|undefined} sons ids of crTaskType and if return undefined, do nothing
 */
const attachSonsTofather = async (taskType, newSons) => {
  if (!newSons) return [];
  const sonsOfTaskType = await CrmTaskTypeSon.findAll({
    where: {
      phatherId: taskType.id,
    },
  });
  const sonsRelatedToThisTaskType = sonsOfTaskType.map((son) => son.sonId);
  const sonsShouldAdd = newSons.filter(
    (new_son_id) => !sonsRelatedToThisTaskType.includes(new_son_id),
  );
  const sonsShouldRemove = sonsRelatedToThisTaskType.filter(
    (son_id) => !newSons.includes(son_id),
  );

  await CrmTaskTypeSon.update(
    {
      status: 0,
    },
    {
      where: {
        sonId: sonsShouldRemove,
      },
    },
  );
  await CrmTaskTypeSon.bulkCreate(
    sonsShouldAdd.map((sonId) => {
      return {
        sonId,
        phatherId: taskType.id,
      };
    }),
  );
};

/**
 * Your GET endpoint
 * get all crm tasks record
 *
 * returns Object
 **/
exports.getCrmTaskTypes = async function (query) {
  return await getAllEntities(query, CrTaskType);
};

exports.getTypeByTag = async (tag) => {
  return await CrTaskType.findOne({
    where: {
      tag,
    },
  });
};

exports.getCrmTaskTypesId = async function (id) {
  return await findAndGet(id, CrTaskType);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.putCrmTaskTypesId = async function (id, body) {
  //check crmTaskType is available for update
  const crmTaskType = await CrTaskType.findByPk(id);
  if (!crmTaskType) {
    return respondNotFound(`crm task type with id ${id} not found`);
  }

  //check sons Id validation
  const { sons } = body;
  if (!(await isValidSons(sons))) {
    return respondNotFound(`invalid sons id`);
  }

  //attach sons to newTaskType(father)
  await attachSonsTofather(crmTaskType, sons);

  //update task type
  await crmTaskType.update(body);

  return respondSuccess(
    await CrTaskType.findByPk(crmTaskType.id, {
      include: {
        model: CrTaskType,
        as: 'sons',
        required: false,
      },
    }),
  );
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteCrTaskType = async function (id) {
  return await findAndDeleteIntranet(id, CrTaskType);
};
