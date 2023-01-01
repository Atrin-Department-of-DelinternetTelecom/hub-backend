// @ts-check
'use strict';
const _ = require('lodash');
const BaseResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class ResolvesFields extends BaseResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return array
   */
  urlFields(request) {
    return [
      new TextField('Slug')
        .onlyOnSequelize()
        .nullable()
        .filterable()
        .sequelizeGet((attribute, model) => {
          return model.getDataValue(attribute) || null;
        })
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(attribute, _.kebabCase(value));
        }),

      new TextField('Url')
        .exceptOnForms()
        .nullable()
        .virtual((attribute, model) => model.getUrl())
        .fillUsing(() => {})
        .resolveUsing(this.resolveJsonCallback),
    ];
  }

  /**
   * Resolve values into json object.
   *
   * @param {any} value
   * @param {Object} resource
   * @param {String} attribute
   * @return {Object}
   */
  resolveJsonCallback(value, resource, attribute) {
    const values = { [resource.get('locale')]: value };

    resource.translations.forEach((model) => {
      values[model.get('locale')] = model.get(attribute);
    });

    return values;
  }

  /**
   *
   * @param {Object} request
   * @param {Object} model
   * @param {string} attribute
   * @return {Promise<void>}
   */
  fillCallback(request, model, attribute) {
    if (request.has(attribute)) {
      const locale = model.locale || Object.keys(request.input(attribute))[0];

      model.set('locale', locale);
      model.set(
        attribute,
        request.input(`${attribute}.${locale}`, model.get(attribute)),
      );

      // @ts-ignore
      return async (request, model, transction) => {
        await this.upsert(request, model, transction, attribute);
      };
    }
  }

  /**
   * Update relation ships.
   *
   * @param {Object} request
   * @param {Object} model
   * @param {Object} transction
   * @param {string} attribute
   */
  async upsert(request, model, transction, attribute) {
    const resource = request.resource();

    for (const locale in request.input(attribute)) {
      // no need to update current resource
      if (locale === model.get('locale')) continue;

      // find translation or create it for the `locale` if it doesn't exist
      const [instance, created] = await resource.model().findOrCreate({
        where: {
          group: model.get('group'),
          locale,
        },
        defaults: {
          name: model.get('name'),
          ...{ [attribute]: request.input(`${attribute}.${locale}`) },
        },
        transction,
      });

      // dispatch event if translation was created
      if (created) await resource.created(request, instance);

      // check if need to update translation
      if (instance.get(attribute) == request.input(`${attribute}.${locale}`)) {
        continue;
      }

      await instance.update(
        {
          [attribute]: request.input(`${attribute}.${locale}`),
        },
        { transction },
      );

      await resource.updated(request, instance);
    }
  }
};
