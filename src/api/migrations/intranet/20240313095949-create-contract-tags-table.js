'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('contract_tags', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      comment_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      contract_tag_category_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('contract_tags');
  },
};
