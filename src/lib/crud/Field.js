//@ts-check
'use strict';

const _ = require('lodash');
const Authorizable = require('./Traits/Authorizable');
const Conditional = require('./Traits/Conditional');
const Displayable = require('./Traits/Displayable');
const Filterable = require('./Traits/Filterable');
const HasMeta = require('./Traits/HasMeta');
const helpers = require('@utils/helpers');
const { Mixin } = require('ts-mixer');
const Sortable = require('./Traits/Sortable');
const SequelizeField = require('./Traits/SequelizeField');
const SwaggerField = require('./Traits/SwaggerField');

module.exports = class Field extends (
  Mixin(
    Authorizable,
    Conditional,
    Displayable,
    Filterable,
    HasMeta,
    Sortable,
    SequelizeField,
    SwaggerField,
  )
) {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'string';

  /**
   * Display name of the field.
   *
   * @type {string}
   */
  name;

  /**
   * Corresponding database column name.
   *
   * @type {string}
   */
  attribute;

  /**
   * The resolved field value.
   *
   * @type {any}
   */
  value;

  /**
   * Callback that using to resolve the model.
   *
   * @type {function}
   */
  resolveCallback;

  /**
   * Callback that using to fill the model.
   *
   * @type {function}
   */
  fillCallback;

  /**
   * Callback that using to authorize the field.
   *
   * @type {function | boolean}
   */
  canSeeCallback = true;

  /**
   * The validation rules for creation and updates.
   *
   * @type {Array}
   */
  validationRules = [];

  /**
   * The validation rules for creation.
   *
   * @type {Array}
   */
  createValidationRules = [];

  /**
   * The validation rules for update.
   *
   * @type {Array}
   */
  updateValidationRules = [];

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super();
    this.name = name;
    this.attribute = attribute ?? this.guessAttribute(name);
  }

  /**
   * Build attribute from field name.
   *
   * @param  {string} name
   * @return {string}
   */
  guessAttribute(name) {
    return _.snakeCase(name);
  }

  /**
   * Set field help text.
   *
   * @param  {string} help
   * @return {this}
   */
  help(help) {
    this.withMeta('help', help);

    return this;
  }

  /**
   * Determine field is required or not.
   *
   * @param  {Boolean} required
   * @return {this}
   */
  required(required = true) {
    this.withMeta('required', required);

    return this;
  }

  /**
   * Detect that field is required or not.
   *
   * @return {boolean}
   */
  isRequired() {
    return this.meta('required') === true || this.meta('nullable') !== true;
  }

  /**
   * Determine field is readonly or not.
   *
   * @param  {Boolean} readonly
   * @return {this}
   */
  readonly(readonly = true) {
    this.withMeta('readonly', readonly);

    return this;
  }

  /**
   * Detect that field is readonly or not.
   *
   * @return {boolean}
   */
  isReadonly() {
    return this.meta('readonly') === true;
  }

  /**
   * Determine field can accept null.
   *
   * @param  {Boolean | Array} nullable
   * @param  {Array} nullValues
   * @return {this}
   */
  nullable(nullable = true, nullValues = ['', null, 'null']) {
    if (typeof nullable !== 'boolean') {
      nullValues = [...nullValues, ...nullable];
      nullable = true;
    }

    this.withMeta('nullable', nullable);
    this.withMeta('nullValues', nullValues);
    this.sequelizeNullable();
    this.sequelizeSet((value, attribute, model) => {
      model.setDataValue(attribute, this.isNullValue(value) ? null : value);
    });

    return this;
  }

  /**
   * Detect that field is nullable.
   *
   * @return {Boolean}
   */
  isNullable() {
    return this.meta('nullable') === true;
  }

  /**
   * Determine if the given values is null.
   *
   * @return {Boolean}
   */
  isNullValue(value) {
    return this.meta('nullValues', []).indexOf(value) !== -1;
  }

  /**
   * Determin if field used for primary key.
   *
   * @return {this}
   */
  primaryKey() {
    this.withMeta('isPrimaryKey', true);

    return this;
  }

  /**
   * Detect that field used for primary key.
   *
   * @return {Boolean}
   */
  isPrimary() {
    return this.meta('isPrimaryKey') === true;
  }

  /**
   * Set the resolve callback.
   *
   * @param {(value, resource, attribute) => any} resolveCallback
   * @return {this}
   */
  resolveUsing(resolveCallback) {
    this.resolveCallback = resolveCallback;

    return this;
  }

  /**
   * Resolve value for the given resource.
   *
   * @param  {Object}  request
   * @param  {Object}  resource
   * @return {Promise<function|void>}
   */
  async resolve(request, resource) {
    let value = this.resolveAttribute(resource, this.attribute);

    if (typeof this.resolveCallback === 'function') {
      value = await this.resolveCallback.apply(this, [
        value,
        resource,
        this.attribute,
      ]);
    }

    this.withMeta({ value });
  }

  /**
   * Resolve the given attribute from the given resource.
   *
   * @param  {any}  resource
   * @param  {string}  attribute
   * @return {any}
   */
  resolveAttribute(resource, attribute) {
    return _.get(resource, attribute.replace(/->/g, '.'));
  }

  /**
   * Set the fill callback.
   *
   * @param {function} fillCallback
   * @return {this}
   */
  fillUsing(fillCallback) {
    this.fillCallback = fillCallback;

    return this;
  }

  /**
   * Fill the given model for incoming request.
   *
   * @param  {Object} req
   * @param  {Object} model
   * @return {function|undefined}
   */
  fill(req, model) {
    return this.fillInto(req, model);
  }

  /**
   * Fill the given model for incoming request.
   *
   * @param  {Object} req
   * @param  {Object} model
   * @return {function|undefined}
   */
  fillForAction(req, model) {
    return this.fill(req, model);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {function|undefined}
   */
  fillInto(request, model, attribute = null) {
    return this.fillAttribute(request, attribute ?? this.attribute, model);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {string}  attribute
   * @param  {object}  model
   * @return {function|undefined}
   */
  fillAttribute(request, attribute, model) {
    return typeof this.fillCallback === 'function'
      ? this.fillCallback(request, model, attribute)
      : this.fillAttributeFromRequest(request, model, attribute);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {function|void}
   */
  fillAttributeFromRequest(request, model, attribute) {
    if (!request.has(attribute)) return;

    const value = helpers.with(request.input(attribute), (input) => {
      return this.isNullable() && this.isNullValue(input) ? null : input;
    });

    return attribute.includes('->')
      ? this.setJsonAttribute(value, model, attribute)
      : this.setAttribute(value, model, attribute);
  }

  /**
   * Hydrate the given attribute on the model.
   *
   * @param  {any}  value
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {void}
   */
  setAttribute(value, model, attribute) {
    model.set(attribute.split('->')[0], value);
  }

  /**
   * Hydrate the given attribute on the model.
   *
   * @param  {any}  value
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {void}
   */
  setJsonAttribute(value, model, attribute) {
    const key = attribute.split('->')[0];
    const path = attribute.substring(key.length + 2).replace(/->/g, '.');
    const json = helpers.with(model.get(key) ?? {}, (value) => {
      return typeof value === 'string' ? JSON.parse(value) : value;
    });

    _.set(json, path, value);

    model.set(key, json);
  }

  /**
   * Set authorize callback.
   *
   * @param  {function|Boolean} canSeeCallback
   * @return {this}
   */
  canSee(canSeeCallback = true) {
    this.canSeeCallback = canSeeCallback;

    return this;
  }

  /**
   * Set authorize callback.
   *
   * @param  {function|Boolean} canSeeCallback
   * @return {this}
   */
  cantSee(canSeeCallback = true) {
    return typeof canSeeCallback !== 'function'
      ? this.canSee(!canSeeCallback)
      : this.canSee((request) => !canSeeCallback(request));
  }

  /**
   * Authorize field for given request.
   *
   * @param  {any} request
   * @return {Boolean}
   */
  authorize(request) {
    return typeof this.canSeeCallback === 'function'
      ? this.canSeeCallback(request)
      : this.canSeeCallback;
  }

  /**
   * Set validation ruels for creation and updates.
   *
   * @param {any[]| string | ((value: string,attribute: string,  fail: () => any) => void)} rules
   * @return {this}
   */
  rules(...rules) {
    this.validationRules = rules;

    return this;
  }

  /**
   * Get validation ruels for creation and updates.
   *
   * @param {Object} request
   * @return {Object}
   */
  getRules(request) {
    return {
      [this.validationKey()]: [...this.validationRules].flat(),
    };
  }

  /**
   * Set validation ruels for creation.
   *
   * @param {any[]} rules
   * @return {this}
   */
  creationRules(...rules) {
    this.createValidationRules = rules.flat();

    return this;
  }

  /**
   * Get validation ruels for creation.
   *
   * @param {Object} request
   * @return {Object}
   */
  getCreationRules(request) {
    return {
      [this.validationKey()]: [
        ...this.createValidationRules,
        ...Object.values(this.getRules(request)),
      ].flat(),
    };
  }

  /**
   * Set validation ruels for updates.
   *
   * @param {any[]} rules
   * @return {this}
   */
  updateRules(...rules) {
    this.updateValidationRules = rules.flat();

    return this;
  }

  /**
   * Get validation ruels for updates.
   *
   * @param {Object} request
   * @return {Object}
   */
  getUpdateRules(request) {
    return {
      [this.validationKey()]: [
        ...this.updateValidationRules,
        ...Object.values(this.getRules(request)),
      ].flat(),
    };
  }

  /**
   * Get validation key name.
   *
   * @return {string}
   */
  validationKey() {
    return this.attribute;
  }

  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  jsonSerialize() {
    return {
      name: this.name,
      attribute: this.attribute,
      type: this.type,
      required: this.isRequired(),
      nullable: false,
      help: '',
      nullValues: [],
      ...this.meta(),
    };
  }
};
