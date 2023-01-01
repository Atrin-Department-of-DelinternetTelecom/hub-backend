'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('access_token_tag', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      access_token_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      contract_tag_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('access_token_tag');
  },
};
