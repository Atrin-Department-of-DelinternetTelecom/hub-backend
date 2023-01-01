//@ts-check
'use strict';

const { DelinternetQuestion } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const QuestionFields = require('./fields/Question');

module.exports = class Question extends Resource {
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
   * @return array
   */
  fields(request) {
    return new QuestionFields().fields(request);
  }

  model() {
    return DelinternetQuestion;
  }
};
