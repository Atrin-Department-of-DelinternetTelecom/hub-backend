'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gf_contract_data_cell', 'simType', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      defaultValue: 'physical', // or esim
    });
    await queryInterface.addColumn('gf_contract_data_cell', 'email', {
      type: Sequelize.DataTypes.STRING,
      allowNull: null,
      defaultValue: null,
      comment: 'ESIM connected email',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_contract_data_cell', 'simType');
    await queryInterface.removeColumn('gf_contract_data_cell', 'email');
  },
};
