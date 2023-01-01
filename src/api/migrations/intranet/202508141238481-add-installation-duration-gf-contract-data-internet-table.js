'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'gf_contract_data_internet',
      'installationDuration',
      {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 120,
        comment: 'Technician installation duration time',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'gf_contract_data_internet',
      'installationDuration',
    );
  },
};
