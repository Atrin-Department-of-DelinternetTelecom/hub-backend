'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;
const { UnpaidInvoice, UnpaidXml } = require('@models').intranet;
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

      const xml = await UnpaidXml.findOne({
        order: SEquelize.literal('RAND()'),
      });

      values.push({
        name: faker.finance.accountName(),
        iban: faker.finance.iban(),
        bic: faker.finance.bic(),
        bic_name: faker.finance.accountName(),
        invoice_id: invoice.id,
        xml_id: xml.id,
        uid: 90,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('unpaid_banks', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_banks', null, {});
  },
};
