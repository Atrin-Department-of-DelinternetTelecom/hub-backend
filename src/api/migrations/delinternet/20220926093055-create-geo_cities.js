'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('geo_cities', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      manual: {
        allowNull: false,
        type: Sequelize.TINYINT,
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
      idescat_code: {
        allowNull: true,
        type: Sequelize.INTEGER,
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
      mhap_province_code: {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: false,
      },
      ine_province_code: {
        allowNull: true,
        type: Sequelize.INTEGER,
        unique: false,
      },
      province_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'geo_provinces',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      import_streets: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      streets_imported_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      import_numbers: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      numbers_imported_at: {
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('geo_cities');
  },
};
