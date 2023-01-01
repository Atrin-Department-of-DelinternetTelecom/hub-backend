'use strict';

const utils = require('@utils/writer');
const FormCategory = require('@service/global/FormCategoryService');

module.exports.deleteFormCategoriesId = function deleteFormCategoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FormCategory.deleteFormCategoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormCategories = function getFormCategories(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  FormCategory.getFormCategories(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormCategoriesId = function getFormCategoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  FormCategory.getFormCategoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putFormCategoriesId = function putFormCategoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  FormCategory.putFormCategoriesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFormCategories = function postFormCategories(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  FormCategory.postFormCategories(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
