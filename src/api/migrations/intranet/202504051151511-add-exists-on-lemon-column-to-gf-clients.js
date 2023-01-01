'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('gf_clients', 'exists_on_lemon', {
      type: Sequelize.DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indicates client exists on the lemon provider.',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('gf_clients', 'exists_on_lemon');
  },
};
