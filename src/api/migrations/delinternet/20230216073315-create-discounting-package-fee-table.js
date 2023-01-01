'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('discounting_package_fee', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      type: {
        comment: 'fix,percentage',
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      amount: {
        comment: 'amount of discount value',
        allowNull: false,
        type: Sequelize.DataTypes.INTEGER.UNSIGNED,
      },
      discounting_package_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      gf_fee_group_id: {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('discounting_package_fee');
  },
};
