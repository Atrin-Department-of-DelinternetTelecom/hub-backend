//@ts-ignore
'use strict';
const _ = require('lodash');
const Conversion = require('./conversion');
const { throwUnless } = require('@utils/helpers');

module.exports = class MediaCollection {
  /**
   * The colelction name.
   *
   * @var string
   */
  #name;

  /**
   * The colelction options.
   *
   * @var string
   */
  #options = {};

  constructor(name, options = {}) {
    this.#name = name;
    this.#options = typeof options === 'object' ? options : { disk: options };
  }

  /**
   * Get the collection name.
   *
   * @return string
   */
  get name() {
    return this.#name;
  }

  /**
   * Get storage disk.
   *
   * @return string
   */
  get disk() {
    return this.#get('disk');
  }

  /**
   * Set storage disk.
   *
   * @param  {String} disk
   * @return {Object}
   */
  set disk(disk) {
    this.#set({ disk });
  }

  /**
   * Alias of the `disk` method.
   *
   * @param  {String} disk
   * @return {Object}
   */
  useDisk(disk) {
    this.disk = disk;

    return this;
  }

  /**
   * Set the file path generator.
   *
   * @param {function} pathGenerator
   * @returns {VoidFunction}
   */
  setPathGenerator(pathGenerator) {
    throwUnless(
      typeof pathGenerator === 'function',
      'The path generator should be function',
    );

    this.#set({ pathGenerator });
  }

  /**
   * Get store path for the given media.
   *
   * @param {Object} media
   * @param {Object} model
   * @returns {String}
   */
  getPath(media, model) {
    const callback = this.#get('pathGenerator', (media, model) => {
      return media.metadata?.path;
    });

    return callback(media, model);
  }

  /**
   * Set the name generator.
   *
   * @param {function} nameGenerator
   * @returns {VoidFunction}
   */
  setNameGenerator(nameGenerator) {
    throwUnless(
      typeof nameGenerator === 'function',
      'The filename generator should be function',
    );

    this.#set({ nameGenerator });
  }

  /**
   * Get filename for the given media.
   *
   * @param {Object} media
   * @param {Object} model
   * @returns {String}
   */
  getFilename(media, model) {
    const callback = this.#get('nameGenerator', (media, model) => {
      return media.filename;
    });

    return callback(media, model);
  }

  /**
   * Determine that collection can store multiple media.
   *
   * @param {Boolean} multiple
   * @returns {ThisParameterType}
   */
  multiple(multiple = true) {
    return this.#set({ multiple });
  }

  /**
   * Check if the collection can store multiple media.
   *
   * @returns {Boolean} multiple
   */
  isMultiple() {
    return this.#get('multiple', false);
  }

  /**
   * Add custom conversion into collection.
   *
   * @param {Function} callback
   * @return {this}
   */
  addConversion(name, callback) {
    const conversions = this.#get('conversions', []);
    const conversion = new Conversion(name);

    callback(conversion);
    conversions.push(conversion);

    this.#set({ conversions });
  }

  /**
   * Get custom conversion by name.
   *
   * @param {String} name
   * @return {this}
   */
  conversion(name) {
    return this.conversions().find((conversion) => {
      return conversion.get('name') === name;
    });
  }

  /**
   * Get custom conversions.
   *
   * @return {Array}
   */
  conversions() {
    return this.#get('conversions', []);
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
  #get(key = null, defaultValue = null) {
    return key !== null
      ? _.get(this.#options, key, defaultValue)
      : this.#options;
  }
};
