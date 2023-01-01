//@ts-check
'use strict';
const { DelinternetSlider } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const SliderFields = require('./fields/Slider');

module.exports = class Slider extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [{ model: GlobalMedia, as: 'media' }];

  /**
   * Get the uri key.
   *
   * @return string
   */
  uriKey() {
    return 'delinternet-' + super.uriKey();
  }

  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return new SliderFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetSlider;
  }
};
