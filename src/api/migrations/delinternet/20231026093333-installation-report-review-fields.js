'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.addColumn('installation_reports', 'review_status', {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
    });

    await queryInterface.addColumn('installation_reports', 'reviewed_by_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    queryInterface.removeColumn('installation_reports', 'review_status');
    queryInterface.removeColumn('installation_reports', 'reviewed_by_id');
  },
};
