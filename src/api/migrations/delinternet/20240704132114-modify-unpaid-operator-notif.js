'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_operator_notifications',
      {
        uid: 90,
        status: 1,
      },
      {
        uid: { [Sequelize.Op.is]: null },
      },
    );

    await queryInterface.renameColumn(
      'unpaid_operator_notifications',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn(
      'unpaid_operator_notifications',
      'updatedAt',
      'updateDate',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_operator_notifications',
      {
        uid: null,
        status: null,
      },
      {
        uid: 90,
      },
    );

    await queryInterface.renameColumn(
      'unpaid_operator_notifications',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn(
      'unpaid_operator_notifications',
      'updateDate',
      'updatedAt',
    );
  },
};
