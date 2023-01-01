'use strict';

const utils = require('@utils/writer');
const EmploymentStatus = require('@service/hrms/EmploymentStatusService');

module.exports.deleteEmploymentstatusesId = function deleteEmploymentstatusesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  EmploymentStatus.deleteEmploymentstatusesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEmploymentstatuses = function getEmploymentstatuses(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  EmploymentStatus.getEmploymentstatuses(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEmploymentstatusesId = function getEmploymentstatusesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  EmploymentStatus.getEmploymentstatusesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postEmploymentstatuses = function postEmploymentstatuses(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  EmploymentStatus.postEmploymentstatuses(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putEmploymentstatusesId = function putEmploymentstatusesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  EmploymentStatus.putEmploymentstatusesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
