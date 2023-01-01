'use strict';

const SEquelize = require('sequelize');
const { UnpaidTemplate } = require('@models').intranet;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const template = await UnpaidTemplate.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        auto_execute: false,
        executed: false,
        template_id: template.id,
        send_method: 'sms',
        message_template: faker.lorem.sentence(),
        invoice_id: 1, //
        file_id: 0, //
        msg_period: 2,
        msgs_per_period: 2,
        msg_hour: faker.date.recent(),
        xml_file: faker.internet.url(),
        unpaid_fee: 7.5,
        description: faker.lorem.sentence(),
        start_sending_time: faker.date.recent(),
        uid: 90,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_xmls', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_xmls', null, {});
  },
};
