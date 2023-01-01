'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('gf_bono_labels_xref', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      labelId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bonoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable('gf_bono_labels_xref');
  },
};
