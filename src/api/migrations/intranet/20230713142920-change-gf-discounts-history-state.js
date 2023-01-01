'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'gf_discounts_history',
        'action',
        {
          type: Sequelize.ENUM(
            'scheduled',
            'applied',
            'edited',
            'deleted',
            'partialApplied',
            'draft',
          ),
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // To rollback, list the enum values without the new one.
      await queryInterface.changeColumn(
        'gf_discounts_history',
        'action',
        {
          type: Sequelize.ENUM(
            'scheduled',
            'applied',
            'edited',
            'deleted',
            'partialApplied',
          ),
        },
        { transaction },
      );

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};
