'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('satisfaction_forms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      filled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      technician_task_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      form_id: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      answers: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      filled_at: {
        type: Sequelize.DATE,
        defaultValue: null,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.DataTypes.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('satisfaction_forms');
  },
};
