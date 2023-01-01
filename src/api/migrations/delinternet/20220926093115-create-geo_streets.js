'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('geo_streets', {
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
      dgc_code: {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: false,
      },
      type: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      formated_type: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      formated_name: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      alias: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      mhap_city_code: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ine_city_code: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ine_province_code: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      city_id: {
        allowNull: true,
        type: Sequelize.INTEGER.UNSIGNED,
        references: {
          model: 'geo_cities',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
    await queryInterface.dropTable('geo_streets');
  },
};
