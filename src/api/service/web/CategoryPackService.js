'use strict';

const { CategoryPack, Category, Pack, LastUpdate } = require('@models').system;

const { respondNotFound, respondBadRequest } = require('@utils/response');

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
} = require('@utils/request-handler');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a category pack record by id
 *
 * id String
 * returns Object
 **/
exports.deleteCategoriesPacksId = async function (id) {
  return await findAndDelete(id, CategoryPack);
};

/**
 * Your GET endpoint
 * get all category pack record
 *
 * returns Object
 **/
exports.getCategoriesPacks = async function (query) {
  return await getAllEntities(query, CategoryPack);
};

/**
 * Your GET endpoint
 * get single category pack record by id
 *
 * id String
 * returns Object
 **/
exports.getCategoriesPacksId = async function (id) {
  return await findAndGet(id, CategoryPack);
};

/**
 *
 * save category pack
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postCategoriesPacks = async function (body, creator_id) {
  if (
    body.category_id == undefined ||
    (await Category.findByPk(body.category_id)) === null
  ) {
    return respondBadRequest('category not found');
  }

  if (
    body.pack_id == undefined ||
    (await Pack.findByPk(body.pack_id)) === null
  ) {
    return respondBadRequest('pack not found');
  }
  body.creator_id = creator_id;
  return await CategoryPack.create(body);
};

/**
 *
 * update a category pack record by id
 *
 * id String
 * body Body in this example we want to change the
 * returns Object
 **/
exports.putCategoriesPacksId = async function (id, body) {
  return await findAndUpdate(id, body, CategoryPack);
};

CategoryPack.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

CategoryPack.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
