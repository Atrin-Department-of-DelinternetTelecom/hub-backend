'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_vehicle_driver', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      driver_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'global_users',
          key: 'id',
        },
      },
      vehicle_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'hrms_vehicle',
          key: 'id',
        },
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      km_image_start: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      km_image_end: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      start_km_num: {
        type: Sequelize.DOUBLE(8, 2),
        allowNull: true,
      },
      end_km_num: {
        type: Sequelize.DOUBLE(8, 2),
        allowNull: true,
      },
      creator_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('hrms_vehicle_driver');
  },
};
