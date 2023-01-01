'use strict';

const { respondSuccess } = require('@api/utils/response');

const {
  system: { DelinternetQuestion },
} = require('@models');

/**
 * this API provided for CLUB app to get FAQs without pagination
 **/
exports.getFaqs = async (query) => {
  const delinetrnetQuestions = await DelinternetQuestion.findAll({
    where: query?.search?.whereQuery,
  });
  return respondSuccess(delinetrnetQuestions);
};
