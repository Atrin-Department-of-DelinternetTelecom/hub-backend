'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('actions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      bulk_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      params: {
        allowNull: true,
        type: Sequelize.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('params') || '{}');
        },
        set: function (value) {
          this.setDataValue('params', JSON.stringify(value));
        },
      },
      pre: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      post: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      result: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('in-queue', 'pending', 'fulfilled', 'failed'),
        defaultValue: 'in-queue',
      },
      remaining_retry_count: {
        allowNull: false,
        type: Sequelize.INTEGER,
      },
      error: {
        allowNull: true,
        type: Sequelize.TEXT,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('delinternet_hub.actions');
  },
};
