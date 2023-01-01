'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'invoice_clients_extra_fields_categories',
      'required',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    );
    await queryInterface.addColumn(
      'invoice_clients_extra_fields_categories',
      'multiple',
      {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'invoice_clients_extra_fields_categories',
      'required',
    );
    await queryInterface.removeColumn(
      'invoice_clients_extra_fields_categories',
      'multiple',
    );
  },
};
