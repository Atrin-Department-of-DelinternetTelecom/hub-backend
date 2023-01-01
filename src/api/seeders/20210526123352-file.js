'use strict';

const path = require('path');
const { FilesAndDirectories: fad } = require('@config');
const files = ['girl.png', 'zelda.png'];
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    for (let index = 0; index < 20; index++) {
      values.push({
        fileable_id: 1,
        fileable_type: 'test image',
        file: path.join(
          fad.uploads,
          fad.TestFile,
          files[Math.floor(Math.random() * files.length)],
        ),
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
    await queryInterface.bulkInsert('hrms_file', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('hrms_file', null, {});
  },
};
