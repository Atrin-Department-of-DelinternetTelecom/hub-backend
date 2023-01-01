'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.changeColumn(
        'gf_discounts_scheduled',
        'state',
        {
          type: Sequelize.ENUM(
            'pending',
            'applied',
            'canceled',
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
        'gf_discounts_scheduled',
        'state',
        {
          type: Sequelize.ENUM(
            'pending',
            'applied',
            'canceled',
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
