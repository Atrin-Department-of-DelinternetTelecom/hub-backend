'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('suspending_actions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      comment: {
        allowNull: true,
        type: Sequelize.DataTypes.TEXT,
      },
      suspending_reason_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      gf_contract_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      operator_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('suspending_actions');
  },
};
