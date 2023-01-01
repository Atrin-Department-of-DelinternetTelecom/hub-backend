'use strict';

const _ = require('lodash');
const bcrypt = require('bcrypt');

function generatePassword(plainPassword) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(plainPassword, salt);
}

/**
 * @deprecated use `model.find({ where: ..., raw: true, nest: true })` or `(await model.find()).get({ plain: true })`
 * @param {any} model
 */
function modelToJson(model) {
  return JSON.parse(JSON.stringify(model));
}

function isNotNU(data) {
  return !_.isUndefined(data) && !_.isNull(data) ? true : false;
}

/**
 * deletes undefined keys in the object
 * @param {*} o
 * @returns
 */
function cleanObject(o) {
  for (const key in o) {
    // DO NOT add Null or anything else here
    if (o[key] === undefined) {
      delete o[key];
    }
  }

  return o;
}

module.exports = {
  modelToJson,
  generatePassword,
  isNotNU,
  cleanObject,
};
