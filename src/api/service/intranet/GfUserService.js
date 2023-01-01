'use strict';

const {
  intranet: { GfUser },
  system: { User },
} = require('@models');

const { Op } = require('sequelize');

const { getAllEntities, findAndGet } = require('@utils/request-handler');

const { respondSuccess, respondNotFound } = require('@utils/response');

/**
 * Your GET endpoint
 * get all Gf User(information) record
 *
 * returns Object
 **/
exports.getGfUsers = async function (query) {
  return getAllEntities(query, GfUser, { '$global_user.enable$': true }, [
    { model: User, as: 'global_user' },
  ]);
};

/**
 * Your GET endpoint
 * get single Gf User record by id
 *
 * id String
 * returns Object
 **/
exports.getGfUsersId = async function (id) {
  return findAndGet(id, GfUser);
};

exports.getGfUsersNotInSystem = async function () {
  const system_user_emails = [];
  const users = await User.findAll();
  users.forEach((user) => {
    system_user_emails.push(user.email);
  });

  return respondSuccess(
    await GfUser.findAll({
      where: {
        email: {
          [Op.notIn]: system_user_emails,
        },
      },
    }),
  );
};

exports.putGfUsersId = async function (id, body) {
  const gfUser = await GfUser.findByPk(id);
  if (!gfUser) {
    return respondNotFound(`gf user with id ${id} not found`);
  }

  //check role is valid
  await GfUser.update(body, {
    where: {
      id,
    },
  });

  return respondSuccess(await GfUser.findByPk(id));
};
