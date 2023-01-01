'use strict';

const utils = require('@utils/writer');
const TimeRecord = require('@service/hrms/TimeRecordService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteTimeRecordsId = function deleteTimeRecordsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  TimeRecord.deleteTimeRecordsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeRecords = function getTimeRecords(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  TimeRecord.getTimeRecords(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeRecordsGenerateexcel =
  function getTimeRecordsGenerateexcel(req, res, next) {
    const startTime = req.swagger.params.startTime.value;
    const endTime = req.swagger.params.endTime.value;
    const fake = req.swagger.params.fake.value;
    const st_date = new Date(startTime);
    const ed_date = new Date(endTime);
    const diffTime = Math.abs(ed_date - st_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 365) {
      const fileName = `${startTime} to ${endTime}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', 'inline; filename=' + fileName);
    }

    TimeRecord.getTimeRecordsGenerateexcel(startTime, endTime, fake)
      .then(async function (response) {
        if (isResponsePayload(response)) {
          utils.writeJson(res, response);
        } else {
          await response.xlsx.write(res);
        }
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getTimeRecordsId = function getTimeRecordsId(req, res, next) {
  const id = req.swagger.params.id.value;
  TimeRecord.getTimeRecordsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserActivityBetweenTimes =
  function getUserActivityBetweenTimes(req, res, next) {
    const userId = req.swagger.params.userId.value;
    const startDate = req.swagger.params.startDate.value;
    const endDate = req.swagger.params.endDate.value;
    TimeRecord.getUserActivityBetweenTimes(startDate, endDate, userId)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getTimeRecordsOfuser = function getTimeRecordsOfuser(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  TimeRecord.getTimeRecordsOfuser(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTimeRecordsUserGenerateexcel =
  function getTimeRecordsUserGenerateexcel(req, res, next) {
    const startTime = req.swagger.params.startTime.value;
    const endTime = req.swagger.params.endTime.value;
    const fake = req.swagger.params.fake.value;
    const user_id = req.swagger.params.user_id.value;
    TimeRecord.getTimeRecordsUserGenerateexcel(
      startTime,
      endTime,
      fake,
      user_id,
    )
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postTimeRecords = function postTimeRecords(req, res, next) {
  const body = req.swagger.params.body.value;
  TimeRecord.postTimeRecords(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTimeRecordsDoclock = function putTimeRecordsDoclock(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  TimeRecord.putTimeRecordsDoclock(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTimeRecordsId = function putTimeRecordsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  TimeRecord.putTimeRecordsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTimeRecordsSetexit = function putTimeRecordsSetexit(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  TimeRecord.putTimeRecordsSetexit(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTimeRecordsSetexitall = function putTimeRecordsSetexitall(
  req,
  res,
  next,
) {
  TimeRecord.putTimeRecordsSetexitall()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTodaysLastTimeRecords = function (req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  TimeRecord.getTodaysLastTimeRecords(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
