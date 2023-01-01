'use strict';

const {
  intranet: { CrmUser },
  system: { User },
} = require('@models');

const { getAllEntities, findAndGet } = require('@utils/request-handler');

const { respondNotFound, respondSuccess } = require('@utils/response');

/**
 * Your GET endpoint
 * get all crm users record
 *
 * returns Object
 **/

exports.getCrmUsers = async function (query) {
  return getAllEntities(query, CrmUser, { '$global_user.enable$': true }, [
    { model: User, as: 'global_user' },
  ]);
};

exports.getCrmUserByUserId = async function (userId) {
  return CrmUser.findOne({
    where: {
      userId,
    },
  });
};

exports.putCrmUsersId = async function (id, body) {
  // check user exist
  const crmUser = await CrmUser.findByPk(id);
  if (!crmUser) {
    return respondNotFound(`crm user with id ${id} not found`);
  }

  await CrmUser.update(body, {
    where: {
      id,
    },
  });

  return respondSuccess(await CrmUser.findByPk(id));
};

exports.getCrmUsersId = async function (id) {
  return findAndGet(id, CrmUser);
};
