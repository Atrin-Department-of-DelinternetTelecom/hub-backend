'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_material', 'description', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
    await queryInterface.changeColumn('hrms_material', 'image', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
    await queryInterface.changeColumn('hrms_material', 'return_date', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
    await queryInterface.changeColumn('hrms_material', 'receive_date', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('hrms_material', 'description');
    await queryInterface.changeColumn('hrms_material', 'image');
    await queryInterface.changeColumn('hrms_material', 'return_date');
    await queryInterface.changeColumn('hrms_material', 'receive_date');
  },
};
