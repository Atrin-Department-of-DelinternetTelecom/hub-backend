'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'gf_contract_data_internet',
      'config_wifi_on_reconfig',
      {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'gf_contract_data_internet',
      'config_wifi_on_reconfig',
    );
  },
};
