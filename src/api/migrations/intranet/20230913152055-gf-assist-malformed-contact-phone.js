'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('gf_assists', 'malformedContactPhone', {
      type: DataTypes.STRING(255),
      allowNull: true,
      after: 'contactPhone',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_assists', 'malformedContactPhone');
  },
};
