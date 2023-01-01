'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_contracts_unpaid', 'startReason', {
      type: DataTypes.STRING(255),
      allowNull: true,
      after: 'end',
    });

    await queryInterface.addColumn('gf_contracts_unpaid', 'endReason', {
      type: DataTypes.STRING(255),
      allowNull: true,
      after: 'end',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_contracts_unpaid', 'startReason');
    await queryInterface.removeColumn('gf_contracts_unpaid', 'endReason');
  },
};
