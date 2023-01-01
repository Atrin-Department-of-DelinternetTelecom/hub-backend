'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn(
      'unpaid_notifications',
      'provider_message_id',
      {
        type: DataTypes.STRING,
        allowNull: true,
      },
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn(
      'unpaid_notifications',
      'provider_message_id',
    );
  },
};
