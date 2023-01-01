'use strict';

const SEquelize = require('sequelize');

const { User } = require('@models').system;

const { GfClient, UnpaidNotification } = require('@models').intranet;

const faker = require('faker');

const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const sent_by = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const notification = await UnpaidNotification.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const client = await GfClient.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        notification_id: notification.id,
        client_id: client.id,
        sent_by: sent_by.id,
        send_method: 'telegram',
        reason: faker.lorem.word(),
        issue_date: faker.date.recent(),
        uid: 90,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_un_sent_notifications', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_un_sent_notifications', null, {});
  },
};
