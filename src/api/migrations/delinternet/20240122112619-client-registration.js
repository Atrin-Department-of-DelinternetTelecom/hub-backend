'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_registrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
        references: {
          model: 'global_users',
          key: 'id',
        },
      },
      doc_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      technical_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      commercial_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      population: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      contacted_rate: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      mobile_lines: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      n_fix: { type: Sequelize.TEXT, allowNull: true },
      installation_prices: { type: Sequelize.TEXT, allowNull: true },
      portability: { type: Sequelize.BOOLEAN, allowNull: true },
      come_down: { type: Sequelize.TEXT, allowNull: true },
      mobile_rate: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      postal_code: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      dni_cif_nie: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      street_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      email: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      phone: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      account_number: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      intervention: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      fractioned_in: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      permanence_of: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      penalty_of: {
        type: Sequelize.DECIMAL,
        allowNull: true,
      },
      housing_type: {
        type: Sequelize.ENUM('rent', 'owned'),
        allowNull: true,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      birth_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      review_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      installation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.DataTypes.NOW,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      // deleted_at: {
      //   type: Sequelize.DATE,
      //   allowNull: true,
      //   defaultValue: null,
      // },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_registrations');
  },
};
