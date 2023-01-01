'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('hrms_material', 'image');
    await queryInterface.addColumn('hrms_material', 'image_1', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('hrms_material', 'image_2', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('hrms_material', 'image_3', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_material', 'image', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.removeColumn('hrms_material', 'image_1');
    await queryInterface.removeColumn('hrms_material', 'image_2');
    await queryInterface.removeColumn('hrms_material', 'image_3');
  },
};
