// @ts-check
'use strict';
const _ = require('lodash');
const config = require('@config');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const ResolvesFields = require('./ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

const locales = config.get('index.locales', []);

module.exports = class Tag extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return array
   */
  fields(request) {
    const options = locales.reduce((locales, locale) => {
      locales[locale.locale] = locale.name;

      return locales;
    }, {});

    return [
      new ID(),

      new Enum('Language', 'locale')
        .exceptOnForms()
        .default('en')
        .options(options)
        .sortable()
        .filterable(),

      new TextField('Group')
        .nullable()
        .default('')
        .hideWhenUpdating()
        .sequelize('set', function (value) {
          this.setDataValue('group', value || Date.now().toString());
        }),

      new JsonField('Name')
        .required()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Slug')
        .nullable()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new TextField('Name')
        .onlyOnSequelize()
        .required()
        .sortable()
        .filterable(),

      ...this.urlFields(request),
    ];
  }
};
