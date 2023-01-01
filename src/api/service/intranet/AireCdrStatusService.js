'use strict';

const { GfAireCdrStatus } = require('@models').intranet;

const { getAllEntities } = require('@utils/request-handler');

const _ = require('lodash');

const moment = require('moment');

const { Op } = require('sequelize');

/**
 * Your GET endpoint
 * get all Contracts(information) record
 *
 * returns Object
 **/
exports.getAireCdrStatus = async function (query) {
  const where = this.extractWhere(query);
  return await getAllEntities(query, GfAireCdrStatus, where);
};

exports.extractWhere = (query) => {
  const date = _.get(query, 'search.whereQuery.date', null);
  if (date && moment(date).isValid()) {
    delete query.search.whereQuery.date;
    return {
      date: {
        [Op.between]: [
          moment(date).startOf('month').format('YYYY-MM-DD'),
          moment(date).endOf('month').format('YYYY-MM-DD'),
        ],
      },
    };
  }
};
