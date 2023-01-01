'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const user = await User.findOne({ order: SEquelize.literal('RAND()') });
    values.push({
      name: 'all',
      creator_id: user.id,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    return queryInterface.bulkInsert('acl_roles', values, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('acl_roles', null, {});
  },
};
