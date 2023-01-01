'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.renameColumn(
      'unpaid_change_fee_notifications',
      'created_at',
      'creation_date',
    );

    await queryInterface.renameColumn(
      'unpaid_change_fee_notifications',
      'updated_at',
      'update_date',
    );

    await queryInterface.addColumn(
      'unpaid_change_fee_notifications',
      'status',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
    );

    await queryInterface.addColumn('unpaid_change_fee_notifications', 'uid', {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 90,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn(
      'unpaid_change_fee_notifications',
      'creation_date',
      'created_at',
    );

    await queryInterface.renameColumn(
      'unpaid_change_fee_notifications',
      'update_date',
      'updated_at',
    );
    await queryInterface.removeColumn('unpaid_change_fee_notifications', 'uid');

    await queryInterface.removeColumn(
      'unpaid_change_fee_notifications',
      'status',
    );
  },
};
