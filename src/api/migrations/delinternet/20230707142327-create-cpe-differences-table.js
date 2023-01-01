'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable('cpe_differences', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      serial_number: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'cpe serial number (cpeSn)',
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'id of device in cpe',
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
        comment: 'indicates contract exists on cpe',
      },
      need_factory_reset: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates cpe already configured for other connection',
      },
      has_credential_error: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'indicates cpe and contract has diffrent credentials',
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
    await queryInterface.dropTable('cpe_differences');
  },
};
