'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'unpaid_invoices',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn(
      'unpaid_invoices',
      'updatedAt',
      'updateDate',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'unpaid_invoices',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn(
      'unpaid_invoices',
      'updateDate',
      'updatedAt',
    );
  },
};
