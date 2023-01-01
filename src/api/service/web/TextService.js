'use strict';

const { Text, Definition, Section, Fee, LastUpdate } =
  require('@models').system;

const {
  getAllEntities,
  createCatch,
  findAndUpdate,
  findAndDelete,
  findAndGet,
} = require('@utils/request-handler');

const { respondBadRequest, respondSuccess } = require('@utils/response');

const { Op } = require('sequelize');

const _ = require('lodash');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a section record by id
 *
 * id String
 * returns Object
 **/
exports.deleteTextsId = async function (id) {
  return await findAndDelete(id, Text);
};

/**
 * Your GET endpoint
 * get all sections(information) record
 *
 * returns Object
 **/
exports.getTexts = async function (query) {
  return await getAllEntities(query, Text);
};

/**
 * Your GET endpoint
 * get single section record by id
 *
 * id String
 * returns Object
 **/
exports.getTextsId = async function (id) {
  return await findAndGet(id, Text);
};

/**
 *
 * add a section record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postTexts = async function (body, creator_id) {
  const { locator_type, locator_id, locator, text, language } = body;
  // if (body.locator_id == undefined ||
  //     body.locator == undefined ||
  //     !(location.definition.includes(body.locator) || location.section.includes(body.locator))
  // ) {
  //     return respondBadRequest("locator or locator_id is wrong")
  // }

  if (!['definition', 'section', 'fee'].includes(locator_type)) {
    return respondBadRequest('invalid locator type');
  }

  let locatorModel = null;
  if (locator_type === 'definition') {
    locatorModel = await Definition.findByPk(locator_id);
  } else if (locator_type === 'section') {
    locatorModel = await Section.findByPk(locator_id);
  } else if (locator_type === 'fee') {
    locatorModel = await Fee.findByPk(locator_id);
  }
  if (_.isNull(locatorModel)) {
    return respondBadRequest('locator not found');
  }

  const textModel = await Text.findOne({
    where: {
      locator_id,
      locator_type,
      locator,
      language,
    },
  });

  if (textModel) {
    return respondBadRequest('this translation already exist');
  }

  // if (location.definition.includes(body.locator) && await Definition.findByPk(body.locator_id) === null) {
  //     return respondBadRequest("definition not found")
  // }

  // if (location.section.includes(body.locator) && await Section.findByPk(body.locator_id) === null) {
  //     return respondBadRequest("section not found")
  // }

  body.creator_id = creator_id;
  return createCatch(body, Text);
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
exports.putTextsId = async function (id, body) {
  return await findAndUpdate(id, body, Text);
};

Text.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Text.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
