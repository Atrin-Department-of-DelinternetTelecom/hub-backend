'use strict';

const utils = require('@utils/writer');
const LeaveRequests = require('@service/hrms/LeaveRequestsService');

// export const getLeaveRequests = createRoute({
//   handler(req, res) {
//     const url = new URL(req.protocol + '://' + req.get('host'));
//     return Service.getLeaveRequests(req.query, url);
//   },
// });

module.exports.getLeaveRequests = function getLeaveRequests(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));

  LeaveRequests.getLeaveRequests(req.query, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLeaveRequestsByUserId = function getLeaveRequests(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;

  LeaveRequests.getLeaveRequestsByUserId(req.query, id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLeaveRequestById = function getLeaveRequestById(
  req,
  res,
  next,
) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;
  LeaveRequests.getLeaveRequestById(id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postLeaveRequest = function postLeaveRequest(req, res, next) {
  LeaveRequests.postLeaveRequest(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUserLeaveRequest = function postUserLeaveRequest(
  req,
  res,
  next,
) {
  LeaveRequests.postUserLeaveRequest(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteLeaveRequest = function deleteLeaveRequest(
  req,
  res,
  next,
) {
  const LeaveRequestId = req.swagger.params.id.value;
  LeaveRequests.deleteLeaveRequest(LeaveRequestId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateLeaveRequest = function updateLeaveRequest(
  req,
  res,
  next,
) {
  const LeaveRequestId = req.swagger.params.id.value;
  LeaveRequests.updateLeaveRequest(LeaveRequestId, req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateUserLeaveRequest = function updateUserLeaveRequest(
  req,
  res,
  next,
) {
  const LeaveRequestId = req.swagger.params.id.value;
  LeaveRequests.updateUserLeaveRequest(LeaveRequestId, req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
