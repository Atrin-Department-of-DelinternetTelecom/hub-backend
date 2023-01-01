'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_templates',
      {
        uid: 90,
        status: 1,
      },
      {
        uid: { [Sequelize.Op.is]: null },
      },
    );

    await queryInterface.renameColumn(
      'unpaid_templates',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn(
      'unpaid_templates',
      'updatedAt',
      'updateDate',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_templates',
      {
        uid: null,
        status: null,
      },
      {
        uid: 90,
      },
    );

    await queryInterface.renameColumn(
      'unpaid_templates',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn(
      'unpaid_templates',
      'updateDate',
      'updatedAt',
    );
  },
};
