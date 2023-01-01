'use strict';
const { DataTypes } = require('sequelize');

module.exports = class {
  /**
   * Set sequelize config.
   *
   * @param  {string} attribute
   * @param  {any} value
   * @return {this}
   */
  sequelize(key, value) {
    this.withMeta('sequelize', { ...this.meta('sequelize', {}), [key]: value });

    return this;
  }

  /**
   * Preapare field for sequelize.
   *
   * @return {Object}
   */
  sequelizeConfig() {
    return {
      name: this.attribute,
      type: this.sequelizeType(),
      primaryKey: this.isPrimary(),
      autoIncrement: this.isPrimary(),
      allowNull: this.isNullable(),
      defaultValue: this.meta('defaultValue'),
      ...this.meta('sequelize', {}),
    };
  }

  /**
   * Set as virtual column.
   *
   * @param  {function} getter
   * @param  {function} setter
   * @return {this}
   */
  virtual(getter = null, setter = null) {
    this.sequelize('type', DataTypes.VIRTUAL);
    this.sequelizeNullable();
    this.sequelizeSet(setter);
    this.sequelizeGet(getter);

    return this;
  }

  /**
   * Set sequelize allowNull value.
   *
   * @return {this}
   */
  sequelizeNullable(allowNull = true) {
    this.sequelize('allowNull', allowNull);

    return this;
  }

  /**
   * Set sequelize getter.
   *
   * @param {(attribute: string, model: import('@models').AnyModel) => any} callback
   * @return {this}
   */
  sequelizeGet(callback) {
    if (typeof callback === 'function') {
      const attribute = this.attribute;

      this.sequelize('get', function () {
        return callback.apply(this, [attribute, this]);
      });
    }

    return this;
  }

  /**
   * Set sequelize setter.
   *
   * @param {(value: any, attribute: string, model: import('@models').AnyModel) => void} callback
   * @return {this}
   */
  sequelizeSet(callback) {
    if (typeof callback !== 'function') {
      callback = () => {};
    }

    const attribute = this.attribute;

    this.sequelize('set', function (value) {
      callback.apply(this, [value, attribute, this]);
    });

    return this;
  }

  /**
   * Guess the sequelize attribute type of the field.
   *
   * @return {string}
   */
  sequelizeType() {
    switch (this.type) {
      case 'long':
        return DataTypes.TEXT('long');
      case 'textarea':
        return DataTypes.TEXT;
      case 'number':
        return DataTypes.INTEGER(this.meta('maxLength', 11));
      case 'float':
      case 'decimal':
      case 'double':
        return DataTypes.DECIMAL(this.precision, this.length);
      case 'datetime':
        return DataTypes.DATE;
      case 'date':
        return DataTypes.DATEONLY;
      case 'enum':
        return DataTypes.ENUM(Object.keys(this.meta('options')));
      case 'virtual':
        return DataTypes.VIRTUAL;
      default:
        return DataTypes.STRING(this.meta('maxLength', 255));
    }
  }
};
