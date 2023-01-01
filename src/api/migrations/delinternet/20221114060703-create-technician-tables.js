'use strict';

module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('technician_tasks', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      // the name of ui table that needs pinning feature. it's not a polymorphism column
      type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // id of row that should be pinned
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      state: {
        type: Sequelize.ENUM(
          'pending',
          'in_progress',
          'done',
          'cancelled',
          'error',
        ),
        allowNull: false,
      },
      scheduled_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      cancel_reason: {
        type: Sequelize.ENUM(
          'by_operator',
          'by_technician',
          'timeout',
          're_scheduled',
        ),
        allowNull: true,
      },
      cancelled_by: {
        type: Sequelize.ENUM(
          'operator',
          'technician',
          'timeout',
          're_schedule',
        ),
        allowNull: true,
      },
      technician_user_id: {
        // system global user id
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      gf_client_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      gf_contract_id: {
        type: Sequelize.BIGINT.UNSIGNED,
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

    await queryInterface.addIndex('technician_tasks', ['type', 'type_id']);

    await queryInterface.createTable('technician_steps', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      task_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      index: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      state: {
        type: Sequelize.ENUM('pending', 'in_progress', 'done', 'error'),
        allowNull: false,
        defaultValue: 'pending',
      },
      error: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex('technician_steps', ['task_id'], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('technician_tasks');
    await queryInterface.dropTable('technician_steps');
  },
};
