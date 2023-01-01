'use strict';

const { modelToJson } = require('@utils/tools');
const { User } = require('@models').system;
const { MoozaicUser } = require('@models').moozaic;
const { getAllEntities, findAndGet } = require('@utils/request-handler');
const { respondNotFound, respondSuccess } = require('@utils/response');
const { createHash } = require('crypto');

/**
 * get list of users
 * get list of users
 *
 * returns Object
 **/
exports.getMoozaicUsers = async function (query) {
  const hrmsEmails = await getHrmsEmails();
  const moozaicUsers = await getAllEntities(query, MoozaicUser);
  const data = modelToJson(moozaicUsers.payload.data);
  moozaicUsers.payload.data = data.map((element) => {
    element.hrms = false;
    if (hrmsEmails.includes(element.email)) {
      element.hrms = true;
    }
    return element;
  });
  return moozaicUsers;
};

/**
 * Your GET endpoint
 * get a single user
 *
 * id String id of table user
 * returns Object
 **/
exports.getMoozaicUsersId = async function (id) {
  const hrmsEmails = await getHrmsEmails();
  const moozaicUserModel = await findAndGet(id, MoozaicUser);
  const moozaicUserJson = modelToJson(moozaicUserModel);
  moozaicUserJson.payload.data.hrms = false;
  if (hrmsEmails.includes(moozaicUserJson.payload.data.email)) {
    moozaicUserJson.payload.data.hrms = true;
  }
  return moozaicUserJson;
};

const getHrmsEmails = async () => {
  const hrmsEmail = await User.findAll({
    attributes: ['email'],
  });
  return hrmsEmail.map((emailObject) => emailObject.email);
};

exports.updateMoozaicUser = async (moozaicUser, _body) => {
  const body = { ..._body };

  const hashed = createHash('md5').update(body.password).digest('hex');

  if (
    body.password &&
    moozaicUser.password !== body.password &&
    moozaicUser.password !== hashed
  ) {
    body.password = hashed;
  } else {
    delete body.password;
  }

  await MoozaicUser.update(body, {
    where: {
      id: moozaicUser.id,
    },
  });
};

exports.putMoozaicUsersId = async (id, body) => {
  const moozaicUser = await MoozaicUser.findByPk(id);
  if (!moozaicUser) {
    return respondNotFound(`moozaic user with id ${id} not found.`);
  }

  await exports.updateMoozaicUser(moozaicUser, body);

  return respondSuccess(await MoozaicUser.findByPk(id));
};
