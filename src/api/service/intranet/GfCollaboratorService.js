'use strict';

const {
  GfUser,
  GfCollaborator,
  GfCrmEvent,
  GfCrmEventUserXref,
  GfCrmEventClientTag,
  GfCrmEventExtraField,
} = require('@models').intranet;

const { Op } = require('sequelize');

const _ = require('lodash');

const { hasRole } = require('./AclService');

const { getAllEntities } = require('@utils/request-handler');

exports.getMyCollaborator = async (userId) => {
  const gfUser = await GfUser.findOne({
    where: {
      userId,
    },
  });
  let collaborator = await GfCollaborator.findByPk(
    _.get(gfUser, 'collaboratorId', 0),
  );
  if (!collaborator && hasRole('admin', null, 'goufone')) {
    collaborator = await exports.getGoufoneCollaborator();
  }
  return collaborator;
};

exports.getGoufoneCollaborator = async () => {
  return await GfCollaborator.findOne({
    where: {
      master: 1,
      status: 1,
      uid: 90,
    },
  });
};

exports.selectIfNoSpecificCollaborator = async (reference) => {
  const master = await exports.getGoufoneCollaborator();
  const masterId = master ? master.id : -1;
  return await GfCrmEvent.findAll({
    where: {
      status: 1,
      uid: 90,
      reference,
      [Op.or]: [
        {
          collaboratorId: null,
        },
        {
          collaboratorId: -1,
        },
        {
          collaboratorId: 0,
        },
        {
          collaboratorId: masterId,
        },
      ],
    },
  });
};

exports.hydrateFor = async (object) => {
  const related_users = await GfCrmEventUserXref.findAll({
    where: {
      gfCrmEventId: object.id,
      status: 1,
      uid: 90,
    },
  });
  object.users = related_users;

  const related_extraFields = await GfCrmEventExtraField.findAll({
    where: {
      gfCrmEventId: object.id,
      status: 1,
      uid: 90,
    },
  });
  object.extraFieldsIds = related_extraFields;

  const related_clientTags = await GfCrmEventClientTag.findAll({
    where: {
      crmEventId: object.id,
      status: 1,
      uid: 90,
    },
  });
  object.clientTags = related_clientTags;

  return object;
};

/**
 * Your GET endpoint
 * get all gf colaborators (information) record
 *
 * returns Object
 **/
exports.getGfCollaborators = async function (query) {
  const response = await getAllEntities(query, GfCollaborator, undefined);
  response.payload.data.push({ id: -1, name: '-' });
  return response;
};
