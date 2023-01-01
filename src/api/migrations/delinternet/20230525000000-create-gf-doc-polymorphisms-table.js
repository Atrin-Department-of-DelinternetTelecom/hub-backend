'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('gf_doc_polymorphisms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      gf_doc_id: {
        allowNull: false,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      used_for: {
        allowNull: false,
        type: Sequelize.DataTypes.STRING,
      },
      used_for_id: {
        allowNull: false,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
      deleted_at: {
        allowNull: true,
        type: Sequelize.DataTypes.DATE,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('gf_doc_polymorphisms');
  },
};
