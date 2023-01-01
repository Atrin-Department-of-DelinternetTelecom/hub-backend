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
    CREATE VIEW discount_contract_tag_view AS
    SELECT 
        CAST(CONCAT(gde.id, ct.id) AS UNSIGNED) AS id,
        gde.id AS executed_id,
        gde.targetContractId AS target_contract_id,
        ct.id AS tag_id,
        ct.name AS tag_name 
    FROM 
        gf_discounts_executed gde
        LEFT JOIN contract_tag_mappings ctm ON gde.targetContractId = ctm.gf_contract_id 
        LEFT JOIN contract_tags ct ON ct.id = ctm.contract_tag_id  
    WHERE 
        ct.id IS NOT NULL;

  `);
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {
    queryInterface.sequelize.query(`DROP VIEW discount_contract_tag_view`);
  },
};
