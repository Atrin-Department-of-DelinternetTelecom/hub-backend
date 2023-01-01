'use strict';

const { default: Download } = require('@api/http/Responses/Download');
const { throwIf } = require('@api/utils/helpers');
const Action = require('@lib/crud/Action');

const handleResponse = (res, data) => {
  if (data instanceof Download) {
    res.respondDownload({ filename: data.name, buffer: data.file });
  } else {
    res.respondSuccess(data ?? Action.success());
  }
};

module.exports.handle = function (req, res, next) {
  const action = req.action();
  const resource = req.resource();
  const where = action.isDirect()
    ? { id: req.route('id') }
    : { id: req.input('resources') ?? [] };
  const fields = new FakeModel();

  resource
    .model()
    .findAll({ where })
    .then(async (resources) => {
      throwIf(
        resources.length === 0 && !action.isStandalone(),
        'Not found any resources to run action on it',
      );

      await action.validateForAction(req);

      const callbacks = action
        .fieldCollection(req)
        .all()
        .map((field) => field.fillForAction(req, fields));

      await Promise.all(callbacks);

      return action.handle(req, resources, fields.getAttributes());
    })
    .then((response) => handleResponse(res, response))
    .catch((error) => {
      console.error(error);
      res.respondError(error);
    });
};

const FakeModel = class FakeModel {
  #attributes = {};

  set(key, value) {
    this.#attributes[key] = value;
  }

  get(key) {
    return this.#attributes[key];
  }

  getAttributes() {
    return this.#attributes;
  }
};
