'use strict';

const _ = require('lodash');

function mergeNames(arr) {
  return _.chain(arr)
    .groupBy('title')
    .mapValues(function (v) {
      return _.chain(v).map('errors').flattenDeep();
    })
    .value();
}

const errorText = {
  OBJECT_MISSING_REQUIRED_PROPERTY: (fields) => {
    return `${fields.join(' , ')} is mandatory! `;
  },
  INVALID_FORMAT: (fields) => {
    return `format of ${fields.join(' , ')} is invalid! `;
  },
  INVALID_TYPE: (fields) => {
    return `type of ${fields.join(' , ')} is invalid! `;
  },
  PATTERN: (fields) => {
    return `pattern of ${fields.join(' , ')} is invalid! `;
  },
  ENUM_MISMATCH: (fields) => {
    return `input for ${fields.join(' , ')} is invalid! `;
  },
  MIN_LENGTH: (fields) => {
    return `minimum length of ${fields.join(' , ')} is invalid! `;
  },
  MAX_LENGTH: (fields) => {
    return `maximum length of ${fields.join(' , ')} is invalid! `;
  },
  MINIMUM: (fields) => {
    return `maximum value of ${fields.join(' , ')} is invalid! `;
  },
};

module.exports.generateMessage = function (schemaError) {
  schemaError.results.errors.forEach(({ code, message, path }, index) => {
    switch (code) {
      case 'OBJECT_MISSING_REQUIRED_PROPERTY':
        schemaError.results.errors[index].title = message.split(':')[1].trim();
        break;
      case 'INVALID_TYPE':
      case 'MINIMUM':
      case 'PATTERN':
      case 'ENUM_MISMATCH':
      case 'INVALID_FORMAT':
      case 'MIN_LENGTH':
      case 'MAX_LENGTH':
        schemaError.results.errors[index].title = path[0];
        break;
      default:
        return `Bad Request!`;
    }
  });

  return [
    'OBJECT_MISSING_REQUIRED_PROPERTY',
    'INVALID_TYPE',
    'PATTERN',
    'ENUM_MISMATCH',
    'MIN_LENGTH',
    'MAX_LENGTH',
    'INVALID_FORMAT',
    'MINIMUM',
  ]
    .map((key) => {
      const fields = schemaError.results.errors
        .filter(({ code }) => code === key)
        .map((a) => {
          if (a.description) {
            return `${a.description} - ${a.title}`;
          }

          return a.title;
        });

      if (fields.length === 0) return undefined;
      return errorText[key](fields);
    })
    .join('');
};

module.exports.generateErrorArray = function (schemaError) {
  const errorArray = [];
  schemaError.results.errors.forEach(({ code, message, path }, index) => {
    switch (code) {
      case 'OBJECT_MISSING_REQUIRED_PROPERTY':
        errorArray.push({
          title: message.split(':')[1].trim(),
          errors: [code],
        });
        break;
      case 'INVALID_TYPE':
      case 'PATTERN':
      case 'INVALID_FORMAT':
      case 'ENUM_MISMATCH':
      case 'MIN_LENGTH':
      case 'MAX_LENGTH':
        errorArray.push({
          title: path[0],
          errors: [code],
        });
        break;
      default:
        return `Bad Request!`;
    }
  });

  return mergeNames(errorArray);
};

module.exports.generateQueryErrorMessage = function (schemaError) {
  switch (schemaError.code) {
    case 'OBJECT_MISSING_REQUIRED_PROPERTY':
    case 'INVALID_TYPE':
    case 'PATTERN':
    case 'ENUM_MISMATCH':
    case 'MIN_LENGTH':
    case 'MAX_LENGTH':
      schemaError.title = schemaError.paramName;
      break;
    default:
      return `Bad Request!`;
  }

  return [
    'OBJECT_MISSING_REQUIRED_PROPERTY',
    'INVALID_TYPE',
    'PATTERN',
    'ENUM_MISMATCH',
    'MIN_LENGTH',
    'MAX_LENGTH',
  ]
    .map((key) => {
      const fields = [schemaError]
        .filter(({ code }) => code === key)
        .map((a) => {
          if (a.description) {
            return `${a.description} - ${a.title}`;
          }

          return a.title;
        });

      if (fields.length === 0) return undefined;
      return errorText[key](fields);
    })
    .join('');
};
