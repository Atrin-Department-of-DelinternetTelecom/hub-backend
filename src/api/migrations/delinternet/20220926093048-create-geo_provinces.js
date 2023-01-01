'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('geo_provinces', {
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
      formated_name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      alias: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      country_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'geo_countries',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      import_cities: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      cities_imported_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

  down: async (queryInterface) => {
    await queryInterface.dropTable('geo_provinces');
  },
};
