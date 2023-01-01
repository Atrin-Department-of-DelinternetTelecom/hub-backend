'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_contracts', 'frozen', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      after: 'reference', // Specify the column after which the new column should be inserted
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('gf_contracts', 'frozen');
  },
};
