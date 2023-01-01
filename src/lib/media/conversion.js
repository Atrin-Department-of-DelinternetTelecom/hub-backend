//@ts-ignore
'use strict';
const _ = require('lodash');

module.exports = class Conversion {
  /**
   * The conversion options.
   *
   * @var string
   */
  #options = {};

  constructor(name) {
    this.#set({ name });
  }

  /**
   * Set the image width.
   *
   * @param {Number} width
   * @return {this}
   */
  width(width) {
    return this.#set({ width });
  }

  /**
   * Set the image height.
   *
   * @param {Number} height
   * @return {this}
   */
  height(height) {
    return this.#set({ height });
  }

  /**
   * Set the image quality.
   *
   * @param {Number} quality
   * @return {this}
   */
  quality(quality) {
    return this.#set({ quality });
  }

  /**
   * Set the image format.
   *
   * @param {String} format
   * @return {this}
   */
  format(format) {
    return this.#set({ format });
  }

  /**
   * Set the image blur.
   *
   * @param {Boolean | Number} blur
   * @return {this}
   */
  blur(blur = true) {
    return this.#set({ blur });
  }

  /**
   * Set option value for given key.
   *
   * @param  {Object} options
   * @return {Object}
   */
  #set(key, value) {
    const options = typeof key === 'string' ? { [key]: value } : key;

    this.#options = _.merge(this.#options, options);

    return this;
  }

  /**
   * Set option value for given key.
   *
   * @param   {Object} options
   * @param   {any}  defaultValue
   * @return  {Object}
   */
  get(key = null, defaultValue = null) {
    return _.get(this.#options, key, defaultValue);
  }

  /**
   * Convert to key-value object.
   *
   * @return {Object}
   */
  jsonSerialize() {
    return this.#options;
  }
};
