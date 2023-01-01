'use strict';

const SEquelize = require('sequelize');

const { User } = require('@models').system;

const { GfClient, UnpaidInvoice } = require('@models').intranet;

const faker = require('faker');

const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const seen_by = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const invoice = await UnpaidInvoice.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const client = await GfClient.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        invoice_id: invoice.id,
        client_id: client.id, //
        seenby_id: seen_by.id,
        seen_at: faker.date.recent(),
        seen: 0,
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_notification_logs', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_notification_logs', null, {});
  },
};
