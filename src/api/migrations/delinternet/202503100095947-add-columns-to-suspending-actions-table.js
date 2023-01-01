'use strict';

const { SUSPENDING_STATE } = require('@api/constants/statuses');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('suspending_actions', 'state', {
      type: Sequelize.DataTypes.STRING,
      allowNull: false,
      defaultValue: SUSPENDING_STATE.DONE,
    });
    await queryInterface.addColumn(
      'suspending_actions',
      'provider_tracking_code',
      {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    );
    await queryInterface.addColumn('suspending_actions', 'doc_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: 'Reference to the global documents table',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('suspending_actions', 'state');
    await queryInterface.removeColumn(
      'suspending_actions',
      'provider_tracking_code',
    );
    await queryInterface.removeColumn('suspending_actions', 'doc_id');
  },
};
