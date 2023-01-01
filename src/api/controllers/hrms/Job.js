'use strict';

const utils = require('@utils/writer');
const Job = require('@service/hrms/JobService');

module.exports.deleteJobsId = function deleteJobsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Job.deleteJobsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getJobs = function getJobs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Job.getJobs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getJobsId = function getJobsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Job.getJobsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postJobs = function postJobs(req, res, next) {
  const body = req.swagger.params.body.value;
  Job.postJobs(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putJobsId = function putJobsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Job.putJobsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
