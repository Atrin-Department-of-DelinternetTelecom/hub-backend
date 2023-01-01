'use strict';

const utils = require('@utils/writer');
const Skill = require('@service/hrms/SkillService');

module.exports.deleteSkillsId = function deleteSkillsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Skill.deleteSkillsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSkills = function getSkills(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Skill.getSkills(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSkillsId = function getSkillsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Skill.getSkillsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserSkillsId = function getUserSkillsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Skill.getUserSkillsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.patchSkillsAttachskilltoemployee =
  function patchSkillsAttachskilltoemployee(req, res, next) {
    const body = req.swagger.params.body.value;
    Skill.patchSkillsAttachskilltoemployee(body)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.postSkills = function postSkills(req, res, next) {
  const body = req.swagger.params.body.value;
  Skill.postSkills(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putSkillsId = function putSkillsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Skill.putSkillsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteSkillsUnAttachSkillToEmployee =
  function deleteSkillsUnAttachSkillToEmployee(req, res, next) {
    const employee_id = req.swagger.params.employee_id.value;
    const skill_id = req.swagger.params.skill_id.value;
    Skill.deleteSkillsUnAttachSkillToEmployee(employee_id, skill_id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
