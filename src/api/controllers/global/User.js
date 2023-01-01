'use strict';

const utils = require('@utils/writer');
const User = require('@service/global/UserService');
const {
  importGoogleCalendarEvents,
} = require('@api/service/intranet/ScheduleService');
const {
  respondNotContent,
  respondInternalServerError,
} = require('@api/utils/response');

module.exports.getUsers = function getUsers(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  User.getUsers(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUsers = function postUsers(req, res, next) {
  const body = req.swagger.params.body.value;
  User.postUsers(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteUsersId = function deleteUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  User.deleteUsersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUsersId = function getUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  User.getUsersId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putUsersId = function putUsersId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  User.putUsersId(id, body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteUserAvatarId = function deleteUserAvatarId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  User.deleteUserAvatarId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.resetPassword = function resetPassword(req, res, next) {
  const email = req.swagger.params.email.value;
  const url = req.protocol + '://' + req.get('host');
  User.resetPassword(email, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.changePassword = function changePassword(req, res, next) {
  const body = req.swagger.params.body.value;
  User.changePassword(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMyRole = function getMyRole(req, res, next) {
  User.getMyRole(req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.moveUserAvatarsToMinIO = function moveUserAvatarsToMinIO(
  req,
  res,
  next,
) {
  User.moveUserAvatarsToMinIO()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.importCalendarEvents = (req, res, next) => {
  importGoogleCalendarEvents()
    .then(function () {
      utils.writeJson(res, respondNotContent());
    })
    .catch(function (error) {
      utils.writeJson(res, respondInternalServerError(error));
    });
};
