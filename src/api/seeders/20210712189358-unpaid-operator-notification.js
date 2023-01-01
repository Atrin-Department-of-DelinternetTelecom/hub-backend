'use strict';

const SEquelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { User } = require('@models').system;

const { UnpaidInvoice } = require('@models').intranet;

const moment = require('moment');

const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const AllUnpaidInvoices = await UnpaidInvoice.findAll();

    for (const unpaidInvoice of AllUnpaidInvoices) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });

      const metadata = JSON.stringify(await generateMeta());

      values.push({
        invoice_code: unpaidInvoice.invoice_code,
        invoice_id: unpaidInvoice.id,
        metadata,
        uid: 90,
        client_id: unpaidInvoice.client_id,
        user_id: creator.id,
        status: 1,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert(
      'unpaid_operator_notifications',
      values,
      {},
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unpaid_operator_notifications', null, {});
  },
};

const MESSAGES = [
  'InvalidCronJobException',
  'ClientIsAlreadyBlockException',
  'ClientHasAPendingCutTaskException',
  'ClientHasAnyContractException',
];

const generateMeta = async () => {
  const metaObject = {};
  for (let i = 0; i < 4; i++) {
    const seen = Math.random() < 0.5;
    const id = uuidv4();
    metaObject[id] = {
      id,
      model_type: 'Invoice',
      message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      seen,
      seen_by: seen
        ? await User.findOne({ order: SEquelize.literal('RAND()') })
        : null,
      seen_at: seen ? moment().format('YYYY-MM-DD HH:mm:ss') : null,
      created_by: 0,
      created_at: '2021-09-24 10:19:10',
    };
  }
  return metaObject;
};
