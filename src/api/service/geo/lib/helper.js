'use strict';
const xml2js = require('xml2js');
const config = require('@config');

exports.baseUrl = config.get('geo.baseUrl');

exports.titleCase = (input) => {
  if (!input || input == '') return '';
  input = String(input).toLowerCase();

  return input.charAt(0).toUpperCase() + input.slice(1);
};

exports.str_pad = (input, zeroLead = 2) => {
  return String(input).padStart(zeroLead, '0');
};

exports.xml2json = async (xml) => {
  return xml2js.parseStringPromise(xml, { mergeAttrs: true });
};

exports.qsBinder = (url, qs = []) => {
  return String(url) + '?' + qs.join('&');
};

exports.objectMiner = (obj, orders) => {
  let result = obj;
  try {
    for (const order of orders) {
      if (result === '') result = result[order][0];
      else result = result[order][0];
    }
    return exports.smartCast(result);
  } catch (err) {
    return '';
  }
};

exports.safeObject = (obj, theDefault = '') => {
  if (!obj) return exports.smartCast(theDefault);
  let result = obj;

  if (Array.isArray(result)) while (Array.isArray(result)) result = result[0];
  else if (typeof result === 'object') result = Object.values(result);

  result = exports.smartCast(result);
  if (!result) result = exports.smartCast(theDefault);

  return result;
};

exports.smartCast = (input) => {
  if (Array.isArray(input)) input = exports.safeObject(input);
  if (typeof input === 'object') return input;

  if (/^[+-]?\d+(\.\d+)?$/.test(input)) {
    if (input.includes('.')) input = parseFloat(input);
    else input = parseInt(input);
  } else input = String(input);

  return input;
};
