'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('custom_action_event_types', 'name', {
      allowNull: false,
      type: Sequelize.DataTypes.TEXT('long'),
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('custom_action_event_types', 'name', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
    });
  },
};
