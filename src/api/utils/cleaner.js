'use strict';

exports.cleaner = function (o) {
  for (const i in o) {
    if (!!o[i] && typeof o[i] == 'object') {
      const isNotObject = o[i]._object != undefined && o[i]._object == false;
      const hasValue = o[i]._value != undefined;
      if (isNotObject && !hasValue) {
        o[i] = undefined;
      } else if (hasValue) {
        o[i] = o[i]._value;
      } else if (!isNotObject) {
        //is object
        o[i] = exports.cleaner(o[i]);
      }
    } else if (o[i] != undefined && o[i]._value != undefined) {
      //is not object
      o[i] = o[i]._value;
    }
    if (
      [
        '_type',
        '_timestamp',
        '_object',
        '_value',
        '_writable',
        '_instance',
      ].includes(i)
    ) {
      delete o[i];
    }
  }
  return o;
};
