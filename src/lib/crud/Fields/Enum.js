'use strict';

const Field = require('./../Field');

module.exports = class Enum extends Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type = 'enum';

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string=} attribute
   * @constructor
   */
  constructor(name, attribute = null) {
    super(name, attribute);
    this.swagger('type', 'string');
    this.swagger('enum', this.meta('nullValues', []));
  }

  /**
   * Define select items.
   *
   * @param {Object} options
   * @return {this}
   */
  options(options) {
    this.withMeta('options', options);
    this.swagger('enum', [
      ...Object.keys(options),
      ...this.meta('nullValues', []),
    ]);
    this.swagger(
      'description',
      `VALUES: ${JSON.stringify(Object.keys(options))}`,
    );

    return this;
  }

  /**
   * Define select items.
   *
   * @param {Object} options
   * @return {this}
   */
  from(options) {
    return this.options(
      Object.assign(
        {},
        ...Object.values(options).map((value) => ({ [value]: value })),
      ),
    );
  }
};
