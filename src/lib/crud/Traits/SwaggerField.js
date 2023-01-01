'use strict';

module.exports = class SwaggerField {
  /**
   * Determine that field appears in path.
   *
   * @return {this}
   */
  throughPath() {
    this.required();
    this.through('path');
    this.default(this.type === 'number' ? 0 : '0');

    return this;
  }

  /**
   * Determine that field appears in query.
   *
   * @return {this}
   */
  throughQuery() {
    this.through('query');

    return this;
  }

  /**
   * Determine where parameter appears in request.
   *
   * @param {string} through
   * @return {this}
   */
  through(through = 'body') {
    this.withMeta({ in: through });

    return this;
  }

  /**
   * Check that field can be empty.
   *
   * @return {boolean}
   */
  allowedEmptyValue() {
    if (!this.isNullable()) return false;

    const nullValues = this.meta('nullValues', []);

    return nullValues.includes('') || nullValues.includes(null);
  }

  /**
   * Set custom swagger config.
   *
   * @param  {string} key
   * @param  {any} value
   * @return {this}
   */
  swagger(key, value) {
    this.withMeta('swagger', { ...this.meta('swagger', {}), [key]: value });

    return this;
  }

  /**
   * Set default value for field.
   *
   * @param  {any} defaultValue
   * @return {this}
   */
  default(defaultValue) {
    this.withMeta('defaultValue', defaultValue);

    return this;
  }

  /**
   * Preapare field for swagger definition.
   *
   * @return {Object}
   */
  get swaggerDefinition() {
    return this.swaggerConfig();
  }

  get in() {
    return this.meta('in', 'body');
  }

  /**
   * Preapare field for swagger.
   *
   * @return {Object}
   */
  swaggerConfig() {
    const defaults = {
      in: String(this.in),
      name: String(this.attribute),
      type: String(this.type),
      description: String(this.meta('help') ?? this.name),
      required: this.isRequired(),
      default: this.meta('defaultValue'),
    };

    if (['query', 'formData'].includes(this.in)) {
      defaults.allowEmptyValue = this.allowedEmptyValue();
    }

    if (['float', 'double', 'decimal'].includes(this.type)) {
      defaults.type = 'number';
      defaults.format = 'float';
    }

    if (defaults.type === 'number') {
      defaults.default = Number(defaults.default);
    } else if (defaults.type === 'string') {
      defaults.default = String(defaults.default);
    }

    return {
      ...defaults,
      ...this.meta('swagger', {}),
    };
  }
};
