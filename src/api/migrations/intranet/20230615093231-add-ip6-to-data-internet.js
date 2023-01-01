'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_contract_data_internet', 'ipv6', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_contract_data_internet', 'ipv6');
  },
};
