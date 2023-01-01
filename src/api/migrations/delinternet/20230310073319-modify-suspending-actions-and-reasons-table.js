'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      'suspending_actions',
      'suspending_reason_id',
    );
    await queryInterface.removeColumn('suspending_reasons', 'commentable');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'suspending_actions',
      'suspending_reason_id',
      {
        allowNull: true,
        type: Sequelize.DataTypes.BIGINT.UNSIGNED,
      },
    );
    await queryInterface.addColumn('suspending_reasons', 'commentable', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.DataTypes.BOOLEAN,
    });
  },
};
