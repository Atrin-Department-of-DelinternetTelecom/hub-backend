'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return await queryInterface.createTable('global_media', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      extension: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      filename: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      collection: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      disk: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default',
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      order: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
        default: 0,
      },
      user_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
      model_id: {
        type: Sequelize.INTEGER({ unsigned: true }),
        allowNull: true,
      },
      model_type: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.TEXT('long'),
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
    return await queryInterface.dropTable('global_media');
  },
};
