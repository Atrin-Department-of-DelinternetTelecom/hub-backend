'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('hrms_material', 'return_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn('hrms_material', 'receive_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
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
};
