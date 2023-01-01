'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gf_sim_deliveries', 'addressMapUrl', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_sim_deliveries', 'addressMapUrl');
  },
};
