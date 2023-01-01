'use strict';

const { OneTime } = require('@models').intranet;

/**
 * search tag in selected app and if exist return true and if not, return false
 * @param {string} app search this tag prop in which app
 * @param {string} tag search tag
 * @returns {boolean} return true if exist and return false if not exist
 */
exports.exists = async (app, tag) => {
  //todo: check if exist in cache return from cache
  const model = getModel(app);
  //todo: save in the cache then return
  return (await model.findOne({ where: { tag } })) ? 1 : 0;
};

/**
 * get related model to this app
 * @param {string} app name of app to return related model
 * @returns {object} model
 */
const getModel = (app) => {
  let model = null;
  switch (app) {
    case 'global':
      model = OneTime;
      break;

    default:
      model = OneTime;
      break;
  }
  return model;
};

/**
 * check if this tag exist, do nothing and if not, add tag to selected app database
 * @param {string} app set tag for selected app
 * @param {string} tag add tag to selected app
 */
exports.mark = async (app, tag) => {
  const exist = await exports.exists(app, tag);
  if (exist) {
    return;
  }
  const model = getModel(app);
  await model.create({ tag });
  //todo: add to cache
};

/**
 * check if this tag not exist, do nothing and if exist, remove tag from selected app database
 * @param {string} app remove tag from selected app
 * @param {string} tag to remove from selected app
 */
exports.unMark = async (app, tag) => {
  const exsit = await exports.exists(app, tag);
  if (!exsit) {
    return;
  }
  const model = getModel(app);
  const selectedTag = await model.findOne({ where: { tag } });
  selectedTag.status = 0;
  await selectedTag.save();
  //todo: remove from cache
};
