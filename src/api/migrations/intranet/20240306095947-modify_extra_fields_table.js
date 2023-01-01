'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'invoice_clients_extra_fields',
      'comment_required',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'invoice_clients_extra_fields',
      'comment_required',
    );
  },
};
