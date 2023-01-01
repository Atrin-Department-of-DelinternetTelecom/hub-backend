'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('unpaid_xmls', 'provider_name', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Name of the message provider used to send unpaid XML',
    });

    await queryInterface.addColumn('unpaid_xmls', 'filename', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      comment: 'Original name of the uploaded XML file',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('unpaid_xmls', 'provider_name');
    await queryInterface.removeColumn('unpaid_xmls', 'filename');
  },
};
