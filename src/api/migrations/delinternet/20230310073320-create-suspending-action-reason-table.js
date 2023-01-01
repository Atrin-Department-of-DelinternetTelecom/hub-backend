'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suspending_action_reason', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      suspending_action_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      suspending_reason_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('suspending_action_reason');
  },
};
