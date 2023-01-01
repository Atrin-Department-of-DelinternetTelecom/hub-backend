'use strict';

const SEquelize = require('sequelize');
const { User } = require('@models').system;

const values = [
  {
    alias: 'INTERNET',
    code: 'net',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
  {
    alias: 'Landline telephone FIXE',
    code: 'fix',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
  {
    alias: 'CELL',
    code: 'cell',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
  {
    alias: 'DIGITAL TV',
    code: 'tv',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
  {
    alias: 'INTRANET RADIO',
    code: 'radio',
    created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  },
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < values.length; index++) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      values[index].creator_id = creator.id;
    }
    await queryInterface.bulkInsert('web_categories', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_categories', null, {});
  },
};
