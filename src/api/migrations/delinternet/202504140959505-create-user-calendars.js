'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('user_calendars', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      user_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      color: {
        allowNull: false,
        type: DataTypes.STRING,
        defaultValue: 'black',
      },
      pinned: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      selected_by_default: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indicates the user is selected on the filters by default.',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_calendars');
  },
};
