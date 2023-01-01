'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('assignable_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      action_type: {
        allowNull: false,
        type: Sequelize.STRING,
        default: 'assigned',
      },
      assignable_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      contract_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      operator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('assignable_histories');
  },
};
