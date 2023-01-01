'use strict';

const { USER_TYPE } = require('@api/constants/enum');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('global_users', 'user_type', {
      type: Sequelize.DataTypes.ENUM(Object.values(USER_TYPE)),
      allowNull: false,
      defaultValue: USER_TYPE.CLIENT,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('global_users', 'user_type');
  },
};
