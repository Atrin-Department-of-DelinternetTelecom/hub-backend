'use strict';

const { Faq } = require('@models').system;

const {
  getAllEntities,
  findAndGet,
  findAndDelete,
  findAndUpdate,
} = require('@utils/request-handler');
const { respondCreated } = require('@utils/response');

exports.getFaqs = function (query) {
  return getAllEntities(query, Faq);
};

exports.getFaqById = function (id) {
  return findAndGet(id, Faq);
};

exports.postFaq = async function (body, userId) {
  return respondCreated(
    await Faq.create({
      ...body,
      creator_id: userId,
    }),
  );
};

exports.deleteFaq = function (id) {
  return findAndDelete(id, Faq);
};

exports.updateFaq = function (id, body) {
  return findAndUpdate(id, body, Faq);
};
