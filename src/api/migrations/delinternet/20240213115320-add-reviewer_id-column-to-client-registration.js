'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'client_registrations',
      'client_registrations_ibfk_1',
    );
    await queryInterface.addColumn('client_registrations', 'reviewer_id', {
      allowNull: true,
      type: Sequelize.BIGINT.UNSIGNED,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('client_registrations', 'creator_id', {
      allowNull: false,
      type: Sequelize.BIGINT.UNSIGNED,
      references: {
        model: 'global_users',
        key: 'id',
      },
    });
    await queryInterface.removeColumn('client_registrations', 'reviewer_id');
  },
};
