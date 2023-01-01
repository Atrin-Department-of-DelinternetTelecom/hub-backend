'use strict';

module.exports = function serialize(mixedValue) {
  let val, key, okey;
  let ktype = '';
  let vals = '';
  let count = 0;
  const _utf8Size = function (str) {
    return ~-encodeURI(str).split(/%..|./).length;
  };
  const _getType = function (inp) {
    let match;
    let key;
    let cons;
    let types;
    let type = typeof inp;
    if (type === 'object' && !inp) {
      return 'null';
    }
    if (type === 'object') {
      if (!inp.constructor) {
        return 'object';
      }
      cons = inp.constructor.toString();
      match = cons.match(/(\w+)\(/);
      if (match) {
        cons = match[1].toLowerCase();
      }
      types = ['boolean', 'number', 'string', 'array'];
      for (key in types) {
        if (cons === types[key]) {
          type = types[key];
          break;
        }
      }
    }
    return type;
  };
  const type = _getType(mixedValue);
  switch (type) {
    case 'function':
      val = '';
      break;
    case 'boolean':
      val = 'b:' + (mixedValue ? '1' : '0');
      break;
    case 'number':
      val =
        (Math.round(mixedValue) === mixedValue ? 'i' : 'd') + ':' + mixedValue;
      break;
    case 'string':
      val = 's:' + _utf8Size(mixedValue) + ':"' + mixedValue + '"';
      break;
    case 'array':
    case 'object':
      val = 'a';
      /*
        if (type === 'object') {
          var objname = mixedValue.constructor.toString().match(/(\w+)\(\)/);
          if (objname === undefined) {
            return;
          }
          objname[1] = serialize(objname[1]);
          val = 'O' + objname[1].substring(1, objname[1].length - 1);
        }
        */
      for (key in mixedValue) {
        if (Object.prototype.hasOwnProperty.call(mixedValue, key)) {
          ktype = _getType(mixedValue[key]);
          if (ktype === 'function') {
            continue;
          }
          okey = key.match(/^[0-9]+$/) ? parseInt(key, 10) : key;
          vals += serialize(okey) + serialize(mixedValue[key]);
          count++;
        }
      }
      val += ':' + count + ':{' + vals + '}';
      break;
    case 'undefined':
    default:
      // Fall-through
      // if the JS object has a property which contains a null value,
      // the string cannot be unserialized by PHP
      val = 'N';
      break;
  }
  if (type !== 'object' && type !== 'array') {
    val += ';';
  }
  return val;
};
