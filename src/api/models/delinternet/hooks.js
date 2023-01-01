//@ts-check
'use strict';

const { Op } = require('sequelize');

module.exports = {
  beforeSave: async (model, options) => {
    if (!model.get('slug')) model.set('slug', model.get('name'));

    if (model.get('group')) return;

    model.set('group', Date.now().toString());
    const where = { group: model.get('group') };

    while (await model.constructor.findOne({ where })) {
      where.group = Number(model.get('group')) + 1;
    }

    model.set('group', where.group);
  },

  afterSave: async (model, options) => {
    // check the slug uniqueness
    const sameSlug = await model.constructor.findOne({
      where: {
        slug: model.get('slug'),
        // locale: model.get('locale'),
        id: { [Op.ne]: model.get('id') },
      },
    });

    if (sameSlug === null) return;

    // slug is not unique, so we need to generate a new one
    await model.update(
      {
        slug: `${model.get('slug')}-${model.get('id')}`,
      },
      options,
    );
  },

  afterDestroy: async (model, options) => {
    // delete translations when  a row deleted
    await model.constructor.destroy({
      ...options,
      where: {
        group: model.get('group'),
      },
    });
  },
};
