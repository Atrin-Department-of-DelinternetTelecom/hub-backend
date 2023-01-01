'use strict';

/**
 * This is helper mysql view to make relation between gf_fee_groups and gf_fees table 1:1.
 * also used by club-backend project
 * DO NOT remove it unless you are sure
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE VIEW active_gf_fees_view AS
    SELECT gf_fees.*
    FROM gf_fees
    WHERE id IN (
        SELECT MAX(id) FROM gf_fees
        WHERE gf_fees.status = 1
        GROUP BY feeGroupId
    )
  `);
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {},
};
