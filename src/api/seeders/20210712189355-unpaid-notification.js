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

      const invoice = await UnpaidInvoice.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const client = await GfClient.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        invoice_id: invoice.id,
        client_id: client.id,
        task_id: 2, //
        send_method: 'sms',
        send_status: 'sent',
        to: faker.lorem.sentence(),
        message: faker.lorem.sentence(),
        sent_date: faker.date.recent(),
        send_date: faker.date.recent(),
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_notifications', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_notifications', null, {});
  },
};
