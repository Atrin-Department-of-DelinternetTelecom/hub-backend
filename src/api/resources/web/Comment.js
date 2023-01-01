//@ts-check
'use strict';
const CommentFields = require('./fields/Comment');
const Resource = require('@lib/crud/Resource');
const {
  system: { DelinternetComment, User },
} = require('@models');

module.exports = class Comment extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array<{ model: any, as: string}>}
   */
  include = [
    {
      model: User,
      as: 'user',
    },
  ];

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
   * @return {Array<object>}
   */
  fields(request) {
    return new CommentFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetComment;
  }
};
