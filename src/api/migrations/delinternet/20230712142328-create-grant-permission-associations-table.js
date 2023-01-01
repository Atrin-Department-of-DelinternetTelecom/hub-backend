'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('hrms_grant_permission_associations', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      grantable_permission_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      grant_permission_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('hrms_grant_permission_associations');
  },
};
