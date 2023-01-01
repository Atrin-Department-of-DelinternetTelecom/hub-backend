'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable('action_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      action: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      batch_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
      },
      resource_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
      resource_type: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(255),
        defaultValue: 'pending',
        allowNull: false,
      },
      original: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      changes: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      exception: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      fields: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      payload: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    return await queryInterface.dropTable('action_events');
  },
};
