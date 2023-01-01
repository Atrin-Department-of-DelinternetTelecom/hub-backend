// @ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const Enum = require('@lib/crud/Fields/Enum');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const MediaLibrary = require('./MediaLibrary');
const ResolvesFields = require('./ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class Category extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new Enum('Template').default('default').options({
        default: 'Default Template',
      }),

      new TextField('Language', 'locale')
        .exceptOnForms()
        .default('en')
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
        .filterable()
        .sortable()
        .required()
        .creationRules('required')
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Slug')
        .filterable()
        .sortable()
        .nullable()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Summary')
        .required()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Content')
        .required()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new BooleanField('Active')
        .default(false)
        .sortable()
        .filterable()
        .sequelize('get', function (attribute) {
          return helpers.isTruthy(this.getDataValue(attribute)) ? true : false;
        }),

      new TextField('Name').onlyOnSequelize(),

      ...this.urlFields(request),

      new TextField('Summary').onlyOnSequelize().nullable(),

      new JsonField('Content').onlyOnSequelize().nullable(),

      new MediaLibrary('Desktop')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),

      new MediaLibrary('Mobile')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),
    ];
  }
};
