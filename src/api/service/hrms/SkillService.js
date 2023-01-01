'use strict';

const { Skill, EmployeeSkill, User } = require('@models').system;

const {
  respondSuccess,
  ResponsePayload,
  respondBadRequest,
  respondOK,
  respondNotFound,
} = require('@utils/response');

const {
  getAllEntities,
  createCatch,
  findAndUpdate,
  findAndGet,
} = require('@utils/request-handler');

const { syncMtoN } = require('../../utils/sequelize');

/**
 *
 * delete a skill by id
 *
 * id String id of table skill
 * returns Object
 **/
exports.deleteSkillsId = async function (id) {
  const skill = await Skill.findByPk(id);
  if (!skill) {
    return respondBadRequest(`skill with id ${id} not found`);
  }

  await EmployeeSkill.destroy({
    where: {
      skill_id: id,
    },
    force: true,
  });

  await Skill.destroy({
    where: {
      id,
    },
    force: true,
  });

  return respondOK(`${Skill.name} with id ${id} succesfuly deleted`);
};

/**
 * Your GET endpoint
 * get all skills in system
 *
 * returns Object
 **/
exports.getSkills = async function (query) {
  return await getAllEntities(query, Skill);
};

/**
 * Your GET endpoint
 * get a skill by id
 *
 * id String id of table skill
 * returns Object
 **/
exports.getSkillsId = async function (id) {
  return await findAndGet(id, Skill);
};

/**
 * Your GET endpoint
 * get a skill by id
 *
 * id String id of table skill
 * returns Object
 **/
exports.getUserSkillsId = async function (id) {
  //get found user model
  const foundUser = await findAndGet(
    id,
    User,
    {
      model: Skill,
      as: 'skills',
      through: {
        attributes: ['id', 'details', 'createdAt'],
      },
    },
    false,
    true,
  );
  if (foundUser instanceof ResponsePayload) return foundUser;

  return respondSuccess(foundUser.skills);
};

/**
 *
 * attach skills to employee or a user
 *
 * body Body  (optional)
 * returns Object
 **/
exports.patchSkillsAttachskilltoemployee = async function (body) {
  const { employee_id } = body;

  const user = await User.findByPk(employee_id);
  if (!user) return respondNotFound(`user with id ${employee_id} not found`);

  const ids = Object.values(body.skill_ids);
  const new_skill_ids = ids.filter(
    (value, index, array) => array.indexOf(value) === index,
  );
  const numberOfSkills = await Skill.count({ where: { id: new_skill_ids } });
  if (ids.length !== numberOfSkills)
    return respondNotFound(`invalid skill ids`);

  const current_skill_ids = (
    await EmployeeSkill.findAll({ where: { employee_id } })
  ).map((employeeSkill) => employeeSkill.skill_id);

  const skills_should_add = new_skill_ids.filter(
    (new_ids) => !current_skill_ids.includes(new_ids),
  );

  await EmployeeSkill.bulkCreate(
    skills_should_add.map((skill_id) => ({ skill_id, employee_id })),
  );

  return respondSuccess('skills attached to user');
};

exports.deleteSkillsUnAttachSkillToEmployee = async function (
  employee_id,
  skill_id,
) {
  await EmployeeSkill.destroy({
    where: {
      employee_id,
      skill_id,
    },
    force: true,
  });

  return respondSuccess('skill deleted for user');
};

/**
 *
 * add an skill to system
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postSkills = async function (body) {
  return createCatch(body, Skill);
};

/**
 *
 * update a skill by id
 *
 * id String id of table skill
 * body Body change the name of the skill(in the example) (optional)
 * returns Object
 **/
exports.putSkillsId = async function (id, body) {
  return findAndUpdate(id, body, Skill);
};
