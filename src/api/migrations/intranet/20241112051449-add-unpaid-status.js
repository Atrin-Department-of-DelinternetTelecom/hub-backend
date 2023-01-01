'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('automatic_unpaid_statuses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      method: {
        allowNull: false,
        type: DataTypes.STRING,
        comment: 'Method used to fetch the XML file',
      },
      bankName: {
        allowNull: false,
        type: DataTypes.STRING,
        comment: 'Name of the bank from which XML is fetched',
      },
      state: {
        allowNull: false,
        type: DataTypes.ENUM('success', 'error'),
        comment: 'State indicating success or failure of the fetch',
      },
      fetchDate: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Date and time of the fetch attempt',
      },
      errorDescription: {
        allowNull: true,
        type: DataTypes.TEXT,
        comment: 'describe the error, in case state is error',
      },
      status: {
        defaultValue: 1,
        type: DataTypes.BOOLEAN,
      },
      creationDate: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updateDate: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('automatic_unpaid_statuses');
  },
};
