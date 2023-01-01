'use strict';

const SEquelize = require('sequelize');
const { User, Definition, CategoryPack, Category } = require('@models').system;
const faker = require('faker');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const definitions = await Definition.findAll();

    for (const definition of definitions) {
      for (let index = 0; index < 4; index++) {
        const creator = await User.findOne({
          order: SEquelize.literal('RAND()'),
        });

        const categoryPacks = await CategoryPack.findOne({
          where: {
            pack_id: definition.pack_id,
          },
        });
        if (categoryPacks) {
          const category = await Category.findByPk(categoryPacks.category_id);
          values.push({
            alias: faker.lorem.word(),
            code: category.code,
            weight: 0,
            definition_id: definition.id,
            discount: faker.datatype.float({
              max: 5,
              min: 3,
            }),
            discount_type: 'fix',
            tax: faker.datatype.float({
              max: 5,
              min: 3,
            }),
            tax_type: 'fix',
            discount_permanent: true,
            creator_id: creator.id,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          });
        }
      }
    }
    await queryInterface.bulkInsert('web_sections', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_sections', null, {});
  },
};
