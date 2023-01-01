'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      'geo_countries',
      [
        {
          code: '11',
          mhap_code: 11,
          ine_code: 108,
          name: 'ESPAÑA',
          alias: 'Espanya',
          created_at: '2022-09-23 12:39:20',
          updated_at: '2022-09-23 12:39:20',
        },
      ],
      {},
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('geo_countries', null, {});
  },
};
