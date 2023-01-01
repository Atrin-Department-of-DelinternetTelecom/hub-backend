'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('acl_user_roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      user_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      role_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
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
    await queryInterface.dropTable('acl_user_roles');
  },
};
