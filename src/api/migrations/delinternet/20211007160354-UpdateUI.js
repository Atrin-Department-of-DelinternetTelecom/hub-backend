'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('acl_update_uis', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      is_unzip: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      unzip_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      unzip_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      is_deployed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      deployed_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deployed_user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      version_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      version_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      creator_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('acl_update_uis');
  },
};
