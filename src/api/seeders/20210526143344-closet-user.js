'use strict';

const SEquelize = require('sequelize');
const { User, Closet } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 10; index++) {
      const user = await User.findOne({ order: SEquelize.literal('RAND()') });
      const owner = await User.findOne({ order: SEquelize.literal('RAND()') });
      const closet = await Closet.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values.push({
        owner_id: owner.id,
        closet_id: closet.id,
        creator_id: user.id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    queryInterface.bulkInsert('hrms_closet_user', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_closet_user', null, {});
  },
};
