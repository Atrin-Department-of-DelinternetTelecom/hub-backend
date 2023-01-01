'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('ivoz_differences', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      extension: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'ivoz extension',
      },
      gf_contract_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        comment: 'indicates contract id',
      },
      is_configured: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates contract exists on ivoz',
      },
      has_valid_state: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates contract and ivoz state are sync',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates ivoz state are active',
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ivoz_differences');
  },
};
