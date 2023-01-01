'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    // Check if the table exists
    const [results] = await queryInterface.sequelize.query(`
      SELECT COUNT(*) AS count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'gf_aire_cdr_3';
    `);

    if (results[0].count === 0) {
      // Table does not exist, create it by copying structure
      await queryInterface.sequelize.query(`
        CREATE TABLE gf_aire_cdr_3 LIKE gf_aire_cdr_2;
      `);
    } else {
      console.log('Table gf_aire_cdr_3 already exists. Skipping creation.');
    }
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS gf_aire_cdr_3;
    `);
  },
};
