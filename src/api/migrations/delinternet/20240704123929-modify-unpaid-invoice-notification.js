'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'unpaid_notifications',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn(
      'unpaid_notifications',
      'updatedAt',
      'updateDate',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'unpaid_notifications',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn(
      'unpaid_notifications',
      'updateDate',
      'updatedAt',
    );
  },
};
