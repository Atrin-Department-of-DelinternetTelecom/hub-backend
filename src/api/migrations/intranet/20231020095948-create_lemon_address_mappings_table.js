'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('lemon_address_mappings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      code: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      lemon_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('lemon_address_mappings');
  },
};
