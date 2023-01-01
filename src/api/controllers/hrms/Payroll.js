'use strict';

const utils = require('@utils/writer');
const Payroll = require('@service/hrms/PayrollService');
const { isResponsePayload } = require('@utils/response');

module.exports.deletePayrollsId = function deletePayrollsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Payroll.deletePayrollsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPayrolls = function getPayrolls(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Payroll.getPayrolls(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPayrollsAttachment = function getPayrollsAttachment(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Payroll.getPayrollsAttachment(id)
    .then(async function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};

module.exports.getPayrollsCompanysignature =
  function getPayrollsCompanysignature(req, res, next) {
    const id = req.swagger.params.id.value;
    Payroll.getPayrollsCompanysignature(id)
      .then(function (media) {
        if (isResponsePayload(media)) {
          utils.writeJson(res, media);
        } else {
          res.download(media);
        }
      })
      .catch(function (media) {
        utils.writeJson(res, media);
      });
  };

module.exports.getPayrollsEmployeesignature =
  function getPayrollsEmployeesignature(req, res, next) {
    const id = req.swagger.params.id.value;
    Payroll.getPayrollsEmployeesignature(id)
      .then(function (media) {
        if (isResponsePayload(media)) {
          utils.writeJson(res, media);
        } else {
          res.download(media);
        }
      })
      .catch(function (media) {
        utils.writeJson(res, media);
      });
  };

module.exports.getPayrollsId = function getPayrollsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Payroll.getPayrollsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postPayrolls = function postPayrolls(req, res, next) {
  Payroll.postPayrolls(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putPayrollsId = function putPayrollsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Payroll.updatePayrollsId(id, body)
    .then(function (payroll) {
      utils.writeJson(res, payroll);
    })
    .catch(function (payroll) {
      utils.writeJson(res, payroll);
    });
};

module.exports.postPayrollsId = function postPayrollsId(req, res, next) {
  const id = parseInt(req.swagger.params.id.value);

  Payroll.putPayrollsId(id, req.body)
    .then(async function (payroll) {
      // use path that created (pathes) and create file record and attach record to payroll instance
      const respondPayroll = await Payroll.attachFileToPayroll(
        await Payroll.saveFile(req.files, payroll.payload.data.id),
        payroll.payload.data.id,
      );
      utils.writeJson(res, respondPayroll);
    })
    .catch(function (payroll) {
      utils.writeJson(res, payroll);
    });
};

module.exports.getPayrollsPdfImage = function getPayrollsPdfImage(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Payroll.getPayrollsPdfImage(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};
