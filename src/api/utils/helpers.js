//@ts-check
'use strict';
const _ = require('lodash');
const config = require('@config');

/**
 * Check if value is callback then return its result.
 *
 * @param {any} value
 * @return {any}
 */
exports.value = (value) => {
  return typeof value === 'function' ? value() : value;
};

/**
 * Call the callback with the given value.
 *
 * @param  {any} value
 * @param  {Function} callback
 * @return {any}
 */
exports.with = (value, callback) => {
  return callback(exports.value(value));
};

/**
 * Determin if given value has truthy value.
 *
 * @param  {any} value
 * @return boolean
 */
exports.isTruthy = (value) => {
  const finalValue = exports.value(value);
  // non empty array
  if (_.isArray(finalValue) && !_.isEmpty(finalValue)) {
    return true;
  }
  // non empty object
  if (_.isObject(finalValue) && Reflect.ownKeys(value).length > 0) {
    return true;
  }
  // check positive values
  if (_.isNumber(finalValue)) {
    return finalValue > 0;
  }

  return [true, 'true'].includes(value);
};

/**
 * Determin if given value has falsy value.
 *
 * @param  {any} value
 * @return boolean
 */
exports.isFalsy = (value) => {
  return exports.isTruthy(value) ? false : true;
};

/**
 * Call the callback if given value is invalid.
 *
 * @param  {any} value
 * @param  {Function} trueCallback
 * @param  {Function} falseCallback
 */
exports.when = (value, trueCallback, falseCallback) => {
  return exports.with(exports.value(value), (value) => {
    return exports.isTruthy(value)
      ? exports.value(trueCallback)
      : exports.value(falseCallback);
  });
};

/**
 * Call the callback if given value is invalid.
 *
 * @param  {any} value
 * @param  {Function} callback
 * @return {any}
 */
exports.unless = (value, callback) => {
  return exports.when(value, value, () => {
    return exports.value(callback);
  });
};

/**
 * Create exception if given condition passed.
 *
 * @param  {boolean} condition
 * @param  {String|Object} error
 * @return {void}
 * @throws {Error}
 */
exports.throwIf = (condition, error, ...parameters) => {
  if (!condition) return;

  if (typeof error === 'function') {
    throw new error(...parameters);
  } else {
    throw new Error(error);
  }
};

/**
 * Create exception if the given condition not passed.
 *
 * @param  {boolean} condition
 * @param  {String|Object} error
 * @return {void}
 * @throws {Error}
 */
exports.throwUnless = (condition, error, ...parameters) => {
  return exports.throwIf(!condition, error, ...parameters);
};

/**
 * Generate absolute url for given path.
 *
 * @param {String} path
 * @return {String}
 */
exports.url = (path = '/') => {
  const base = config.get('index.app.url');

  return base + (path ? `/${path}` : '');
};

/**
 * Finds and returns the first value in the array that is populated.
 * If no populated value is found, returns passed "defaultValue".
 *
 * @param {any[]} values - The array to search for a populated value.
 * @param {any} defaultValue - The array to search for a populated value.
 * @returns {*} The first populated value found in the array, or undefined if no populated value is found.
 */
exports.firstPopulated = (values = [], defaultValue = null) => {
  return values.find((value) => exports.isPopulated(value)) ?? defaultValue;
};

/**
 * Checks whether the given value is not null, undefined, or an empty string.
 * @param value {any}
 * @returns {boolean}
 */
exports.isPopulated = (value) => !exports.isNullish(value);

/**
 * Checks whether the given value is null, undefined, or an empty string.
 * @param value {any}
 * @returns {boolean}
 */
exports.isNullish = (value) => {
  // check js nullish values
  if ([null, undefined, NaN].includes(value)) {
    return true;
  }
  // check empty strings
  if (['number', 'string'].includes(typeof value)) {
    return String(value).trim().length === 0;
  }

  return false;
};

/**
 * Wait process until given mili seconds.
 */
exports.sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
