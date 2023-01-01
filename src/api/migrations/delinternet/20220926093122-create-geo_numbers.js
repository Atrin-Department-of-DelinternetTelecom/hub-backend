'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('geo_numbers', {
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
      gml_id: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      rc: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      gml_srs: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      gml_pos_x: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      gml_pos_y: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      gml_lat: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      gml_lng: {
        allowNull: true,
        type: Sequelize.DOUBLE,
      },
      postal_code: {
        allowNull: true,
        type: Sequelize.STRING,
        unique: false,
      },
      number: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      alias: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      rc_meta: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      rc_meta_updated_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      street_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: 'geo_streets',
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
    await queryInterface.dropTable('geo_numbers');
  },
};
