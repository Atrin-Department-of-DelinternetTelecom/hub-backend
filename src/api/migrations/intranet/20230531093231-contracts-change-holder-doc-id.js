'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_contracts_holder_change', 'docId', {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_contracts_holder_change', 'docId');
  },
};
