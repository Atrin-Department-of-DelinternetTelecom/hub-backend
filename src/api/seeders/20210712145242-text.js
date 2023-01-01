'use strict';

const SEquelize = require('sequelize');
const { User, Definition, Section } = require('@models').system;
const faker = require('faker');
const { translation } = require('@config');
const values = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const definitions = await Definition.findAll();
    for (const definition of definitions) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      addText(definition, 'definition', creator.id);
    }

    const sections = await Section.findAll();
    for (const section of sections) {
      const creator = await User.findOne({
        order: SEquelize.literal('RAND()'),
      });
      addText(section, 'section', creator.id);
    }

    await queryInterface.bulkInsert('web_texts', values, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('web_texts', null, {});
  },
};

const languages = ['en', 'ca', 'es'];
const addText = (locator_model, locator_type, creator_id) => {
  const locators =
    locator_type === 'definition'
      ? translation.definition
      : translation.section;
  for (const language of languages) {
    for (const locator of locators) {
      values.push({
        locator_id: locator_model.id,
        locator,
        locator_type,
        text: faker.lorem.sentence(),
        language,
        weight: 0,
        creator_id,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
    }
  }
};
