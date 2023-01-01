'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('discounting_package_client', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      discounting_package_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      gf_client_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('discounting_package_client');
  },
};
