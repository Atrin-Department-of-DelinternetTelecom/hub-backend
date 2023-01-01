'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_clients', 'language', {
      type: DataTypes.STRING(255),
      allowNull: true,
      after: 'nationalityCode', // Specify the column after which the new column should be inserted
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_clients', 'language');
  },
};
