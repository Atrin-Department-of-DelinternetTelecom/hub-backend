'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const { UnpaidInvoice } = require('@models').intranet;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const invoice = await UnpaidInvoice.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        storage_path: 'some storage path',
        storage_link: 'some storage link',
        file_id: 2,
        file_type: 'this is fileable type',
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_files', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_files', null, {});
  },
};
