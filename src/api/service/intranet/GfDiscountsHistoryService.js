'use strict';

const { GfDiscountsHistory, GfUser } = require('@models').intranet;

const { getAllEntities } = require('@utils/request-handler');

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfDiscountsHistories = async function (query) {
  return await getAllEntities(query, GfDiscountsHistory, undefined, [
    {
      model: GfUser,
      as: 'user',
    },
  ]);
};
