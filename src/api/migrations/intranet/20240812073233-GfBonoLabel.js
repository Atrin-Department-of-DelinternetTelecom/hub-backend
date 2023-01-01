'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('gf_bono_labels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
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
    await queryInterface.dropTable('gf_bono_labels');
  },
};
