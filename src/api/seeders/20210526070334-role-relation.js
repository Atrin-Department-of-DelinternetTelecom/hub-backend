'use strict';

const SEquelize = require('sequelize');
const { User, AclRelation, AclRole } = require('@models').system;
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const user = await User.findOne({ order: SEquelize.literal('RAND()') });
    const relation = await AclRelation.findOne({
      order: SEquelize.literal('RAND()'),
    });
    const role = await AclRole.findOne({ order: SEquelize.literal('RAND()') });
    values.push({
      relation_id: 1,
      role_id: 1,
      creator_id: user.id,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });

    return queryInterface.bulkInsert('acl_role_relations', values, {});
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('acl_role_relations', null, {});
  },
};
