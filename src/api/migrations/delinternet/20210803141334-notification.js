'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('global_notifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      owner_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      app: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      concept: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      subject: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      text: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      package: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      read: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
      },
      image: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      icon: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      metadata: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      debug: {
        allowNull: true,
        type: Sequelize.TEXT,
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
    await queryInterface.dropTable('global_notifications');
  },
};
