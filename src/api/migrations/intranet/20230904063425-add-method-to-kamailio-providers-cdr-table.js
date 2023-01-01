'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'gf_kamailio_providers_cdr',
      'importMethod',
      {
        type: Sequelize.DataTypes.STRING(255),
        defaultValue: 'local',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'gf_kamailio_providers_cdr',
      'importMethod',
    );
  },
};
