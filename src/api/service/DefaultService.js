'use strict';

/**
 * Your GET endpoint
 * get a vacation info (of a user) by id of table vacation
 *
 * id String id of vacation table
 * returns Object
 **/
exports.getVacationsId = function (id) {
  return new Promise(function (resolve, reject) {
    const examples = {};
    examples['application/json'] = '{}';
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
};

/**
 * Your GET endpoint
 * get a vehicle by id
 *
 * id String id of table vehicle
 * returns Object
 **/
exports.getVehiclesId = function (id) {
  return new Promise(function (resolve, reject) {
    const examples = {};
    examples['application/json'] = '{}';
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
};
