'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'installation_reports',
      'discount_id',
      'charge_id',
    );

    await queryInterface.addColumn('installation_reports', 'discount_id', {
      type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
    });

    await queryInterface.removeColumn('installation_reports', 'discount');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('installation_reports', 'discount');

    await queryInterface.removeColumn('installation_reports', 'discount_id');

    await queryInterface.renameColumn(
      'installation_reports',
      'charge_id',
      'discount_id',
    );
  },
};
