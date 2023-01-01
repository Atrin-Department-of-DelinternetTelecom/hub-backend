'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('geo_countries', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      manual: {
        allowNull: false,
        type: Sequelize.TINYINT(1),
        defaultValue: 0,
      },
      code: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true,
      },
      mhap_code: {
        allowNull: false,
        type: Sequelize.INTEGER,
        unique: false,
      },
      ine_code: {
        allowNull: false,
        type: Sequelize.INTEGER,
        unique: false,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      alias: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('geo_countries');
  },
};
