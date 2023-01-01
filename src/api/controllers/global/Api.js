'use strict';

const utils = require('@utils/writer');
const PdfApi = require('@service/global/api/PdfApiService');
const AddressApi = require('@service/global/api/AddressApiService');

module.exports.attachImageToPdf = function attachImageToPdf(req, res, next) {
  PdfApi.attachImageToPdf(req.body.signature, req.body.pdf_id, req.files.image)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.generatePdfOfHandlebars = function generatePdfOfHandlebars(
  req,
  res,
  next,
) {
  const model_name = req.swagger.params.model_name.value;
  const requestedId =
    isNaN(req.swagger.params.requestedId.value) == false
      ? parseInt(req.swagger.params.requestedId.value)
      : null;
  const offset = req.query.offset;
  const limit = req.query.limit;

  PdfApi.generatePdfOfHandlebars(model_name, offset, limit, requestedId)
    .then(function (response) {
      if (response.payload) {
        utils.writeJson(res, response);
      }

      res.contentType('application/pdf');
      res.send(response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.generatePdfOfHandlebarsGetAttributes =
  function generatePdfOfHandlebarsGetAttributes(req, res, next) {
    const model_name = req.swagger.params.model_name.value;
    const body = req.swagger.params.body.value;
    const requestedId =
      isNaN(body.requestedId) == false ? parseInt(body.requestedId) : null;
    const attributes = body.attributes ? body.attributes : null;
    const offset = req.query.offset;
    const limit = req.query.limit;

    PdfApi.generatePdfOfHandlebarsGetAttributes(
      model_name,
      offset,
      limit,
      requestedId,
      attributes,
    )
      .then(function (response) {
        if (response.payload) {
          utils.writeJson(res, response);
        }

        res.contentType('application/pdf');
        res.send(response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.generateExcelGetAttributes = function generateExcelGetAttributes(
  req,
  res,
  next,
) {
  const model_name = req.swagger.params.model_name.value;
  const body = req.swagger.params.body.value;
  const requestedId =
    isNaN(body.requestedId) == false ? parseInt(body.requestedId) : null;
  const attributes = body.attributes ? body.attributes : null;
  const offset = req.query.offset;
  const limit = req.query.limit;

  PdfApi.generateExcelGetAttributes(
    model_name,
    offset,
    limit,
    requestedId,
    attributes,
    res,
  )
    .then(function (response) {})
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getProvinces = function getProvinces(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  AddressApi.getProvinces(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCities = function getCities(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const province_code = req.swagger.params.province_code.value;
  AddressApi.getCities(province_code, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getPostalCodes = function getPostalCodes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const city_code = req.swagger.params.city_code.value;
  AddressApi.getPostalCodes(city_code, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStreetTypes = function getStreetTypes(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const city_code = req.swagger.params.city_code.value;
  AddressApi.getStreetTypes(city_code, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStreets = function getStreets(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const city_code = req.swagger.params.city_code.value;
  const rue_type_code = req.swagger.params.rue_type_code.value;
  AddressApi.getStreets(city_code, rue_type_code, req.query).then(function (
    response,
  ) {
    utils.writeJson(res, response);
  });
};

module.exports.getNumbers = function getNumbers(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const street_code = req.swagger.params.street_code.value;
  AddressApi.getNumbers(street_code, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBuildings = function getBuildings(req, res, next) {
  const number = req.swagger.params.number.value;
  AddressApi.getBuildings(number)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStairways = function getStairways(req, res, next) {
  const building_code = req.swagger.params.building_code.value;
  AddressApi.getStairways(building_code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFloors = function getFloors(req, res, next) {
  const stairway_code = req.swagger.params.stairway_code.value;
  AddressApi.getFloors(stairway_code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getDoors = function getDoors(req, res, next) {
  const floor_code = req.swagger.params.floor_code.value;
  AddressApi.getDoors(floor_code)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFormatedAddress = function getFormatedAddress(
  req,
  res,
  next,
) {
  const lat = req.swagger.params.lat.value;
  const lng = req.swagger.params.lng.value;
  AddressApi.getFormatedAddress(lat, lng)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncWithGoufone = function syncWithGoufone(req, res, next) {
  AddressApi.syncWithGoufone()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
