'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('seller_competition_points', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      group: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      item: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      point: {
        allowNull: false,
        defaultValue: 1,
        type: Sequelize.DataTypes.INTEGER,
      },
      label: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('seller_competition_points');
  },
};
