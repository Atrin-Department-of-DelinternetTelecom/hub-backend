'use strict';
const MediaCollection = require('./collection');

const Mixin = {
  /**
   * Get the media collectons.
   *
   * @return Array
   */
  collections: function () {
    return this.options?.collections ?? [];
  },

  /**
   * Get the media collectons.
   *
   * @return Array
   */
  setCollections: function (collections = []) {
    this.options.collections = collections ?? [];

    return this;
  },

  /**
   * Create new media collection by the given name.
   *
   * @param  string name
   * @return Object
   */
  addCollection: function (name, callback) {
    const collection = new MediaCollection(name);
    const collections = this.collections();

    collections.push(collection);
    this.setCollections(collections);

    typeof callback === 'function' && callback(collection);

    return collection;
  },

  /**
   * Get media collection by the given name.
   *
   * @param  string name
   * @return Object
   */
  getCollection: function (name) {
    return this.collections().find((collection) => {
      return collection.name === name;
    });
  },

  /**
   * Check if media collection exists.
   *
   * @param  string name
   * @return Object
   */
  hasCollection: function (name) {
    return this.getCollection(name) !== undefined;
  },
};

module.exports.applyTo = (model) => Object.assign(model, Mixin);
