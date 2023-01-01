'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_settings',
      {
        uid: 90,
      },
      {
        uid: 0,
      },
    );

    await queryInterface.renameColumn(
      'unpaid_settings',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn(
      'unpaid_settings',
      'updatedAt',
      'updateDate',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_settings',
      {
        uid: 0,
      },
      {
        uid: 90,
      },
    );

    await queryInterface.renameColumn(
      'unpaid_settings',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn(
      'unpaid_settings',
      'updateDate',
      'updatedAt',
    );
  },
};
