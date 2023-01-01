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
      CREATE VIEW discount_client_info_view AS
        SELECT gde.id, gde.id as executed_id, gde.targetContractId as target_contract_id, gcl.name as client_name, gcl.id as client_id
        from gf_discounts_executed gde
        left join gf_contracts gc on gc.id = gde.targetContractId 
        left join gf_clients gcl on gcl.id = gc.clientId 
    `);
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {
    queryInterface.sequelize.query(`DROP VIEW discount_client_info_view`);
  },
};
