'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'gf_contracts_holder_change',
      'provider_tracking_code',
      {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        comment: 'Provider tracking code!',
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'gf_contracts_holder_change',
      'provider_tracking_code',
    );
  },
};
