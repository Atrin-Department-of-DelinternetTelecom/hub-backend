'use strict';

const SEquelize = require('sequelize');
const { User, Section, Definition } = require('@models').system;
const { GfFeeGroup, GfSection, GfFeegroupsSectionsXref } =
  require('@models').intranet;
const faker = require('faker');
const values = [];
const types = ['INTRANET', 'FIX', 'CELL', 'TV'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const definitions = await Definition.findAll();
    for (const definition of definitions) {
      const sections = await Section.findAll({
        where: {
          definition_id: definition.id,
        },
      });
      const feeGroups = [];
      for (let index = 0; index < 4; index++) {
        feeGroups.push(
          await GfFeeGroup.findOne({
            include: {
              model: GfSection,
              as: 'sections',
              where: {
                code: types[index],
              },
            },
            order: SEquelize.literal('RAND()'),
          }),
        );
      }

      for (let index = 0; index < 4; index++) {
        const creator = await User.findOne({
          order: SEquelize.literal('RAND()'),
        });
        const section = sections[index];
        if (feeGroups[index] && section) {
          values.push({
            fee_group_id: feeGroups[index].id,
            section_id: section.id,
            creator_id: creator.id,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          });
        }
      }
    }
    await queryInterface.bulkInsert('web_fees', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_fees', null, {});
  },
};
