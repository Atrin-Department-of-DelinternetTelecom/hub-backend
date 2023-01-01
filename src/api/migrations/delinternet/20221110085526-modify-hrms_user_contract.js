'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface
      .describeTable('hrms_user_contracts')
      .then((tableDefinition) => {
        if (tableDefinition.phone_number) {
          return queryInterface.removeColumn(
            'hrms_user_contracts',
            'phone_number',
          );
        }
      });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('hrms_user_contracts', 'phone_number', {
      type: Sequelize.STRING,
      allowNull: true,
      deafult: null,
    });
  },
};
