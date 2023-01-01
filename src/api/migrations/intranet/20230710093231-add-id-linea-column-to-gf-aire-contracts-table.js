'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_aire_contracts', 'id_linea', {
      type: DataTypes.STRING(255),
      allowNull: true,
      after: 'number', // Specify the column after which the new column should be inserted
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_aire_contracts', 'id_linea');
  },
};
