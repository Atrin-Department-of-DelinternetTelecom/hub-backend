'use strict';

const utils = require('@utils/writer');
const Country = require('@service/intranet/CountryService');
const { Country: CountryModel } = require('@api/models').intranet;

const { search } = require('@api/service/intranet/SearchService');

module.exports.deleteCountriesId = function deleteCountriesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Country.destroyCountriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCountries = function getCountries(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Country.getCountries(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.searchCountries = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  search(new CountryModel(), req.query, Object.values(req.orders()))
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
exports.syncCountries = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Country.syncCountries(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCountriesId = function getCountriesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Country.getCountriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCountries = function postCountries(req, res, next) {
  const body = req.swagger.params.body.value;
  Country.postCountries(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCountriesId = function putCountriesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Country.putCountriesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
