'use strict';

const utils = require('@utils/writer');
const Department = require('@service/hrms/DepartmentService');

module.exports.deleteDepartmentsId = function deleteDepartmentsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Department.deleteDepartmentsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getDepartments = function getDepartments(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Department.getDepartments(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getDepartmentsId = function getDepartmentsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Department.getDepartmentsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postDepartments = function postDepartments(req, res, next) {
  const body = req.swagger.params.body.value;
  Department.postDepartments(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putDepartmentsId = function putDepartmentsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Department.putDepartmentsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
