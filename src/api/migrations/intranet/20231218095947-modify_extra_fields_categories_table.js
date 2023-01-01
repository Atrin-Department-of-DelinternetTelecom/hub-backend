'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'invoice_clients_extra_fields_categories',
      'active',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'invoice_clients_extra_fields_categories',
      'active',
    );
  },
};
