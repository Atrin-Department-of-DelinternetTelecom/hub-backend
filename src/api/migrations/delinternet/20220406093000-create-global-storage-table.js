'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('global_storage', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      key: {
        allowNull: Sequelize,
        type: Sequelize.STRING,
      },
      value: {
        allowNull: true,
        type: Sequelize.STRING,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('global_storage');
  },
};
