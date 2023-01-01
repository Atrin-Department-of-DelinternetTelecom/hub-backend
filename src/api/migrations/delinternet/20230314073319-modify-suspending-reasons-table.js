'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('suspending_reasons', 'label', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn('suspending_reasons', 'service', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: '*',
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('suspending_reasons', 'label', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.removeColumn('suspending_reasons', 'service');
  },
};
