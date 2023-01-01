'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_xmls',
      {
        uid: 90,
        status: 1,
      },
      {
        uid: { [Sequelize.Op.is]: null },
      },
    );

    await queryInterface.renameColumn(
      'unpaid_xmls',
      'createdAt',
      'creationDate',
    );

    await queryInterface.renameColumn('unpaid_xmls', 'updatedAt', 'updateDate');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkUpdate(
      'unpaid_xmls',
      {
        uid: null,
        status: null,
      },
      {
        uid: 90,
      },
    );

    await queryInterface.renameColumn(
      'unpaid_xmls',
      'creationDate',
      'createdAt',
    );

    await queryInterface.renameColumn('unpaid_xmls', 'updateDate', 'updatedAt');
  },
};
