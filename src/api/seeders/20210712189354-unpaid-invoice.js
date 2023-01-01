'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;

const { GfClient, UnpaidXml, UnpaidTemplate } = require('@models').intranet;

const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const template = await UnpaidTemplate.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const xml = await UnpaidXml.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const client = await GfClient.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        invoice_code: faker.address.zipCode(),
        invoice_id: 0, //
        client_id: client.id,
        invoice_date: faker.date.recent(),
        msg_period: 2,
        msgs_per_period: 2,
        msg_hour: faker.date.recent(),
        unpaid_fee: 7.5,
        template_id: template.id,
        template: faker.lorem.word(),
        generated_message: faker.lorem.word(),
        invoice_status: 'paid',
        send_method: 'sms',
        cut_date: faker.date.soon(),
        event_id: 3,
        fallback_sms_counter: 4,
        xml_id: xml.id,
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_invoices', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_invoices', null, {});
  },
};
