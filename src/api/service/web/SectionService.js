'use strict';

const { Section, Definition, User, Fee, Text, LastUpdate } =
  require('@models').system;

const { GfFeeGroup, GfFee } = require('@models').intranet;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const { respondBadRequest } = require('@utils/response');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a section record by id
 *
 * id String
 * returns Object
 **/
exports.deleteSectionsId = async function (id) {
  return await findAndDelete(id, Section);
};

/**
 * Your GET endpoint
 * get all sections(information) record
 *
 * returns Object
 **/
exports.getSections = async function (query) {
  return await getAllEntities(query, Section);
};

/**
 * Your GET endpoint
 * get single section record by id
 *
 * id String
 * returns Object
 **/
exports.getSectionsId = async function (id) {
  return await findAndGet(id, Section, [
    {
      model: Definition,
      as: 'definition',
    },
    {
      model: Fee,
      as: 'fees',
      include: {
        model: GfFeeGroup,
        as: 'fee_group',
        include: {
          model: GfFee,
          as: 'gf_fees',
        },
      },
    },
    {
      model: Text,
      as: 'texts',
    },
    {
      model: User,
      as: 'creator',
    },
  ]);
};

/**
 *
 * add a section record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postSections = async function (body, creator_id) {
  if (
    body.definition_id == undefined ||
    (await Definition.findByPk(body.definition_id)) === null
  ) {
    return respondBadRequest('definition not found');
  }
  body.creator_id = creator_id;
  return createCatch(body, Section);
};

/**
 *
 * update a section record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected section (optional)
 * returns Object
 **/
exports.putSectionsId = async function (id, body) {
  return await findAndUpdate(id, body, Section);
};

Section.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Section.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
