'use strict';

const faker = require('faker');
const utils = require('@utils/tools');

const users = [];

users.push({
  first_name: 'del',
  last_name: 'internet',
  username: 'del_internet',
  role: 'super-admin',
  dni: '00',
  enable: true,
  email: 'del@email.com',
  password: utils.generatePassword('password'),
  created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
});

users.push({
  first_name: 'isma',
  last_name: 'web system',
  username: 'web',
  role: 'user',
  dni: '00',
  enable: true,
  email: 'web@delinternet.com',
  password: utils.generatePassword('password'),
  created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
});

// for (let index = 0; index < 20; index++) {
//   users.push({
//     first_name: faker.name.firstName(),
//     last_name: faker.name.lastName(),
//     username: faker.internet.userName(),
//     role: "admin",
//     dni: "00",
//     enable: true,
//     email: faker.internet.email(),
//     password: utils.generatePassword('password'),
//     created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
//     updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
//   })
// }

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('global_users', users, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('global_users', null, {});
  },
};
