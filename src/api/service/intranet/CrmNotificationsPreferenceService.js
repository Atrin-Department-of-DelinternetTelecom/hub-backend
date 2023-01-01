'use strict';

const {
  CrNotificationPreference,
  CrNotificationPreferencesTypesXref,
  CrNotificationPreferencesUsersXref,
  CrNotificationPreferencesTagsXref,
  CrTaskUserXref,
  CrmUser,
  CrTaskType,
  CrTaskExtraField,
} = require('@models').intranet;

const { GlobalNotificationsHistory } = require('@models').moozaic;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

const _ = require('lodash');

const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const { Op } = require('sequelize');
const moment = require('moment');

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyCrmNotificationsPreferencesId = async function (id, userId) {
  const crNotificationPreference = await CrNotificationPreference.findByPk(id);
  if (!crNotificationPreference) {
    return respondNotFound(`preference with id ${id} not found`);
  }

  if (crNotificationPreference.userId !== userId) {
    return respondBadRequest(`this rule is not from ${userId}`);
  }

  await CrNotificationPreference.update(
    {
      status: 0,
    },
    {
      where: {
        id,
      },
    },
  );

  return respondSuccess(`notification with id ${id} successfuly deleted.`);
};

/**
 * Your GET endpoint
 * get all crm notification preference(information) record
 *
 * returns Object
 **/
exports.getCrmNotificationsPreferences = async function (query) {
  return await getAllEntities(query, CrNotificationPreference);
};

/**
 * Your GET endpoint
 * get crm notification preference record by id
 *
 * id String
 * returns Object
 **/
exports.getCrmNotificationsPreferencesId = async function (id) {
  return await findAndGet(id, CrNotificationPreference);
};

/**
 *
 * add a crm notification preference record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postCrmNotificationsPreferences = async function (body, userId) {
  const { users, types, tags } = body;

  if (users && !(await isValidUsers(users))) {
    return respondNotFound(`invalid user ids`);
  }

  if (users && !users.length) {
    return respondBadRequest(`at least one user`);
  }

  if (types && !(await isValidTypes(types))) {
    return respondNotFound(`invalid type ids`);
  }

  if (tags && !(await isValidTags(tags))) {
    return respondNotFound(`invalid Tag ids`);
  }

  body.userId = userId;
  const newCrNotificationPreference = await CrNotificationPreference.create(
    body,
  );
  await syncUsers(users, newCrNotificationPreference.id);
  await syncTypes(types, newCrNotificationPreference.id);
  await syncTags(tags, newCrNotificationPreference.id);

  return respondCreated(
    await CrNotificationPreference.findByPk(newCrNotificationPreference.id, {
      include: [
        {
          model: CrmUser,
          as: 'users',
          required: false,
        },
        {
          model: CrTaskType,
          as: 'types',
          required: false,
        },
        {
          model: CrTaskExtraField,
          as: 'tags',
          required: false,
        },
      ],
    }),
  );
};

/**
 *
 * updat a crm notification preference record by id
 *
 * id String
 * body Body in this example we want to change
 * alias of the selected crm notification preference (optional)
 * returns Object
 **/
exports.putCrmNotificationsPreferencesId = async function (id, body, userId) {
  const { users, types, tags } = body;
  let crNotificationPreference = await CrNotificationPreference.findByPk(id);

  if (!crNotificationPreference) {
    return respondNotFound(`preference with id ${id} not found`);
  }

  if (users && !(await isValidUsers(users))) {
    return respondNotFound(`invalid user ids`);
  }

  if (users && !users.length) {
    return respondBadRequest(`at least one user`);
  }

  if (types && !(await isValidTypes(types))) {
    return respondNotFound(`invalid type ids`);
  }

  if (tags && !(await isValidTags(tags))) {
    return respondNotFound(`invalid Tag ids`);
  }

  delete body.id;
  await CrNotificationPreference.update(body, {
    id,
  });
  crNotificationPreference = await CrNotificationPreference.findByPk(id);
  await syncUsers(users, crNotificationPreference.id);
  await syncTypes(types, crNotificationPreference.id);
  await syncTags(tags, crNotificationPreference.id);

  return respondSuccess(
    await CrNotificationPreference.findByPk(id, {
      include: [
        {
          model: CrmUser,
          as: 'users',
          required: false,
        },
        {
          model: CrTaskType,
          as: 'types',
          required: false,
        },
        {
          model: CrTaskExtraField,
          as: 'tags',
          required: false,
        },
      ],
    }),
  );
};

/**
 * users that we want sync with preference (m to n) relation
 * @param {Array} newUsers list of users
 * @param {number} preferenceId id of preference that we want to sync
 */
const syncUsers = async (newUsers, preferenceId) => {
  if (newUsers && Array.isArray(newUsers)) {
    const currentUserIds = (
      await CrNotificationPreferencesUsersXref.findAll({
        where: {
          notificationsPreferencesId: preferenceId,
        },
      })
    ).map((userXref) => userXref.userId);
    const usersShouldAdd = newUsers.filter(
      (new_user_id) => !currentUserIds.includes(new_user_id),
    );
    const usersShouldRemove = currentUserIds.filter(
      (user_id) => !newUsers.includes(user_id),
    );

    await CrNotificationPreferencesUsersXref.update(
      {
        status: 0,
      },
      {
        where: {
          userId: usersShouldRemove,
        },
      },
    );

    await CrNotificationPreferencesUsersXref.bulkCreate(
      usersShouldAdd.map((userId) => {
        return {
          userId,
          notificationsPreferencesId: preferenceId,
        };
      }),
    );
  }
};

/**
 * check userIds is valid or no
 * @param {Array} users list of users
 * @returns {boolean} validation result
 */
const isValidUsers = async (users) => {
  const count = await CrmUser.count({
    where: {
      userId: users,
    },
  });
  return users.length === count ? true : false;
};

/**
 * types that we want sync with preference (m to n) relation
 * @param {Array} newTypes list of users
 * @param {number} preferenceId id of preference that we want to sync
 */
const syncTypes = async (newTypes, preferenceId) => {
  if (newTypes && Array.isArray(newTypes)) {
    const currentTypeIds = (
      await CrNotificationPreferencesTypesXref.findAll({
        where: {
          notificationsPreferencesId: preferenceId,
        },
      })
    ).map((typeXref) => typeXref.crmTypeId);
    const typesShouldAdd = newTypes.filter(
      (new_type_id) => !currentTypeIds.includes(new_type_id),
    );
    const typesShouldRemove = currentTypeIds.filter(
      (type_id) => !newTypes.includes(type_id),
    );

    await CrNotificationPreferencesTypesXref.update(
      {
        status: 0,
      },
      {
        where: {
          crmTypeId: typesShouldRemove,
        },
      },
    );

    await CrNotificationPreferencesTypesXref.bulkCreate(
      typesShouldAdd.map((crmTypeId) => {
        return {
          crmTypeId,
          notificationsPreferencesId: preferenceId,
        };
      }),
    );
  }
};

/**
 * check typeIds is valid or no
 * @param {Array} types type ids
 * @returns {boolean} validation result
 */
const isValidTypes = async (types) => {
  const count = await CrTaskType.count({
    where: {
      id: types,
    },
  });
  return types.length === count ? true : false;
};

/**
 * tags that we want sync with preference (m to n) relation
 * @param {Array} newTags list of users
 * @param {number} preferenceId id of preference that we want to sync
 */
const syncTags = async (newTags, preferenceId) => {
  if (newTags && Array.isArray(newTags)) {
    const currentTagIds = (
      await CrNotificationPreferencesTagsXref.findAll({
        where: {
          notificationsPreferencesId: preferenceId,
        },
      })
    ).map((tagXref) => tagXref.crmTagId);
    const tagsShouldAdd = newTags.filter(
      (new_tag_id) => !currentTagIds.includes(new_tag_id),
    );
    const tagsShouldRemove = currentTagIds.filter(
      (tag_id) => !newTags.includes(tag_id),
    );

    await CrNotificationPreferencesTagsXref.update(
      {
        status: 0,
      },
      {
        where: {
          crmTagId: tagsShouldRemove,
        },
      },
    );

    await CrNotificationPreferencesTagsXref.bulkCreate(
      tagsShouldAdd.map((crmTagId) => {
        return {
          crmTagId,
          notificationsPreferencesId: preferenceId,
        };
      }),
    );
  }
};

/**
 * check tags is valid or no
 * @param {Array} tags list of extraField ids
 * @returns {boolean} validation result
 */
const isValidTags = async (tags) => {
  const count = await CrTaskExtraField.count({
    where: {
      id: tags,
    },
  });
  return tags.length === count ? true : false;
};

/**
 * get all related config of notification by userIds
 * @param {Array|number} userId userIds for get related confige of notification
 * @param {string} concept get config related to this concept
 * @returns {Promise<array<number>>}
 */
exports.selectUsersSuscribedToUserid = async (userId, concept) => {
  return (
    await CrNotificationPreferencesUsersXref.findAll({
      where: { userId },
      include: {
        model: CrNotificationPreference,
        as: 'preference',
        where: { concept },
      },
    })
  ).map((notifPrefXref) => notifPrefXref.preference.userId);
};

/**
 * set default notification rules
 */
exports.setDefaultRules = async (userId, force = false) => {
  const rules = await CrNotificationPreference.findAll({
    where: { userId },
  });

  if (rules.length > 0 && force == false) {
    return {
      success: false,
      reason: 'Rules presents',
    };
  }

  if (rules.length > 0 && force === true) {
    // remove all previous rules
    await CrNotificationPreference.update(
      {
        status: 0,
      },
      {
        where: { userId },
      },
    );
  }

  // events assigned to me with auto bell and only non executed
  const noExecuted = await CrNotificationPreference.create({
    userId,
    alias: 'Events assigned to me',
    concept: 'new_event_ssigned',
    email: 1,
    autoRemoveBell: 0,
    noExecuted: 1,
    executed: 0,
    noExecutables: 0,
  });
  const executed = await CrNotificationPreference.create({
    userId,
    alias: 'Events assigned to me',
    concept: 'new_event_ssigned',
    email: 1,
    autoRemoveBell: 0,
    noExecuted: 0,
    executed: 0,
    noExecutables: 1,
  });

  await CrNotificationPreferencesUsersXref.bulkCreate([
    {
      notificationsPreferencesId: noExecuted.id,
      userId,
    },
    {
      notificationsPreferencesId: executed.id,
      userId,
    },
  ]);
};
