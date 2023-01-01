'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('web_packs', 'discount', {
      defaultValue: 0,
      type: Sequelize.DOUBLE(8, 2),
    });

    await queryInterface.addColumn('web_packs', 'discount_type', {
      defaultValue: 'fix',
      type: Sequelize.ENUM('percentage', 'fix'),
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('web_packs', 'discount');
    await queryInterface.removeColumn('web_packs', 'discount_type');
  },
};
