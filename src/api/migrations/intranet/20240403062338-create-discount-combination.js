'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('matrix_replacement_combination_sets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      matrixId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        allowNull: false,
        default: 1,
        type: Sequelize.BOOLEAN,
      },
      creationDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updateDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.createTable('matrix_replacement_combination_rules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      combinationSetId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      matrixId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      priority: {
        type: Sequelize.INTEGER,
      },
      status: {
        allowNull: false,
        default: 1,
        type: Sequelize.BOOLEAN,
      },
      creationDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updateDate: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('matrix_replacement_combination_rules');
    await queryInterface.dropTable('matrix_replacement_combination_sets');
  },
};
