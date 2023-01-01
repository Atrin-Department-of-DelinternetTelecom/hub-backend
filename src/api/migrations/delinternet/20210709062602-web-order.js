'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('web_orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      web_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      procesed: {
        allowNull: false,
        defaultValue: 0,
        type: Sequelize.BOOLEAN,
      },
      user_processed_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      status: {
        allowNull: true,
        type: Sequelize.ENUM('pending', 'checked', 'rejected'),
        defaultValue: 'pending',
      },
      fiscal_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      finger_print: {
        type: Sequelize.TEXT,
        defaultValue: '{}',
      },
      fiscal_doc: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      user_type: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      delinternet_user: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      company_name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      surname1: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      surname2: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      phone: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_auto_complete: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      region: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      city: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      postal_code: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_street: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_number: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_stairway: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_floor: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_door: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_lat: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      address_lng: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      service: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('web_orders');
  },
};
