'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('access_tokens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      username: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING,
      },
      password: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      token: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.TEXT,
      },
      expire: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.DATE,
      },
      user_id: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      gf_collaborator_id: {
        allowNull: true,
        defaultValue: null,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        defaultValue: DataTypes.NOW,
        type: DataTypes.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('access_tokens');
  },
};
