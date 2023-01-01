'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('global_custom_action_events', 'client_id', {
      allowNull: false,
      type: Sequelize.DataTypes.BIGINT.UNSIGNED,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'global_custom_action_events',
      'client_id',
    );
  },
};
