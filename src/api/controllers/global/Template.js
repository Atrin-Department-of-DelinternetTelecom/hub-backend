'use strict';

const utils = require('@utils/writer');
const Template = require('@service/global/TemplatesService');
const { ResponsePayload, isResponsePayload } = require('@utils/response');
const { Json } = require('sequelize/lib/utils');

module.exports.deleteTemplatesId = function deleteTemplatesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Template.deleteTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTemplates = function getTemplates(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Template.getTemplates(req.query)
    .then(function (response) {
      if (response.code) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTemplatesId = function getTemplatesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Template.getTemplatesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putTemplatesId = function putTemplatesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Template.putTemplatesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postTemplates = function postTemplates(req, res, next) {
  Template.postTemplates(req.body, req.files.template, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getTemplatesFileId = function getTemplatesFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Template.getTemplatesFileId(id)
    .then(function (response) {
      if (isResponsePayload(response)) utils.writeJson(res, response);
      else res.download(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRenderTemplate = function getTemplatesFileId(req, res, next) {
  const body = {
    template_id: req.swagger.params.template_id.value,
    context: JSON.parse(req.swagger.params.context.value),
  };

  Template.getRenderTemplate(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRenderTemplateByEntity = function getRenderTemplateByEntity(
  req,
  res,
  next,
) {
  const body = {
    template_id: req.swagger.params.template_id.value,
    entity: req.swagger.params.entity.value,
    entity_id: req.swagger.params.entity_id.value,
    context: JSON.parse(req.swagger.params.context.value),
  };

  Template.getRenderTemplateByEntity(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRenderTemplateFile = function getRenderTemplateFile(
  req,
  res,
  next,
) {
  const body = {
    template_id: req.swagger.params.template_id.value,
    context: JSON.parse(req.swagger.params.context.value),
  };

  Template.getRenderTemplateFile(body)
    .then(function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.download(response);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRenderTemplateFileByEntity =
  function getRenderTemplateFileByEntity(req, res, next) {
    const body = {
      template_id: req.swagger.params.template_id.value,
      entity: req.swagger.params.entity.value,
      entity_id: req.swagger.params.entity_id.value,
      context: JSON.parse(req.swagger.params.context.value),
    };

    Template.getRenderTemplateFileByEntity(body)
      .then(function (response) {
        if (isResponsePayload(response)) {
          utils.writeJson(res, response);
        } else {
          res.download(response);
        }
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getRenderDemoById = function getRenderDemoById(req, res, next) {
  const id = req.swagger.params.id.value;
  Template.getRenderDemoById(id)
    .then(function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.download(response);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRenderTextById = function getRenderTextById(req, res, next) {
  const id = req.swagger.params.id.value;
  Template.getRenderTextById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
