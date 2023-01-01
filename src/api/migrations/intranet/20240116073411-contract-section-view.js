'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE VIEW gf_contract_gf_section AS
      SELECT gf_contracts.id as id,gf_sections.id as sectionId,gf_sections.code as sectionName from gf_contracts 
        left join gf_feegroups_sections_xref gf_feegroups_sections_xref on gf_feegroups_sections_xref.feeGroupId = gf_contracts.feeGroupId 
        left join gf_sections on gf_sections.id = gf_feegroups_sections_xref.sectionId 
      WHERE gf_contracts.status = 1 and gf_contracts.uid = 90 and gf_feegroups_sections_xref.status = 1;
  `);
  },
  /**
   *
   * @param {import('sequelize').QueryInterface} queryInterface
   * @param {import('sequelize')} Sequelize
   */
  async down(queryInterface) {},
};
