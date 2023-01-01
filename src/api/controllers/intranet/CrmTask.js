'use strict';

const utils = require('@utils/writer');
const CrmTask = require('@service/intranet/CrmTaskService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteCrmTasksId = function deleteCrmTasksId(req, res, next) {
  const id = req.swagger.params.id.value;
  CrmTask.deleteCrmTasksId(id, req.user.id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmTasks = function getCrmTasks(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmTask.getCrmTasks(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.paginate = function paginate(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmTask.paginate(req.query, req.filters(), req.orders())
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.calendarTasks = function calendarTasks(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CrmTask.calendarTasks(req.query, req.filters(), req.orders())
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

const toNumber = (n) => parseInt(n);

exports.getCrmTasksForCalendar = function getCrmTasksForCalendar(req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  if (req.query.taskTypeIds) {
    req.query.taskTypeIds = req.query.taskTypeIds.split(',').map(toNumber);
  }

  if (req.query.extraFieldIds) {
    req.query.extraFieldIds = req.query.extraFieldIds.split(',').map(toNumber);
  }

  if (req.query.clientExtraFieldIds) {
    req.query.clientExtraFieldIds = req.query.clientExtraFieldIds
      .split(',')
      .map(toNumber);
  }

  if (req.query.userIds) {
    req.query.userIds = req.query.userIds.split(',').map(toNumber);
  }

  CrmTask.getCrmTasksForCalendar(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCrmTasksId = function getCrmTasksId(req, res, next) {
  const id = req.swagger.params.id.value;
  CrmTask.getCrmTasksId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCrmTasks = function postCrmTasks(req, res, next) {
  const body = req.swagger.params.body.value;
  CrmTask.postCrmTasks(body, req.user.userId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCrmTasksId = function putCrmTasksId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CrmTask.putCrmTasksId(id, body, req.user.userId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.tglExecute = function tglExecute(req, res, next) {
  const id = req.swagger.params.id.value;
  const text = req.swagger.params.text.value;

  CrmTask.tglExecute(
    id,
    text,
    null,
    null,
    false,
    req.user.userId,
    true,
    'event',
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMyTask = function getMyTask(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const taskTypes = req.swagger.params.task_types.value;
  CrmTask.getMyTask(req.query, taskTypes, req.user.crm_user_id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTaskInfoByNotification = function getTaskInfoByNotification(
  req,
  res,
  next,
) {
  const notificationId = req.swagger.params.notificationId.value;
  CrmTask.getTaskInfoByNotification(notificationId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
