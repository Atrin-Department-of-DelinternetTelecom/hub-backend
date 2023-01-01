'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

exports.defaultScope = {
  where: {
    status: {
      [Sequelize.Op.not]: config.get('index.intranet.deleteStatus'),
    },
    uid: {
      [Sequelize.Op.or]: [config.get('index.intranet.uid'), -1],
    },
  },
};
