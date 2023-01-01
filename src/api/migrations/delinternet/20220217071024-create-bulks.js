'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bulks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      total_actions: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      total_fulfilled_actions: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      total_failed_actions: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
        defaultValue: 0,
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('scheduled', 'running', 'finished'),
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
      scheduled_for: {
        allowNull: true,
        type: Sequelize.DATE,
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
      finished_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bulks');
  },
};
