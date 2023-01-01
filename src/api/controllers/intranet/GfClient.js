// @ts-check
'use strict';

const utils = require('@utils/writer');
const GfClientService = require('@service/intranet/GfClientService');
const { respondSuccess } = require('@utils/response');
const GfDocumentService = require('@service/documents/GfDocumentService');
const { createRoute } = require('@api/utils/controller-factory');
const GfClientSepa = require('@api/service/intranet/GfClientSepa');
const GfClientDataProtectionDoc = require('@api/service/intranet/GfClientDataProtectionDoc');
const { errors } = require('@api/http/http_errors');
const { getAllDocs } = require('@api/service/intranet/ClientDocuments');
const ContractDocuments = require('@api/service/intranet/ContractDocuments');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { search } = require('@api/service/intranet/SearchService');

exports.deleteGfClientsId = function (req, res) {
  const id = req.swagger.params.id.value;
  GfClientService.destoryGfClientsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGfClients = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfClientService.getGfClients(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.searchGfClients = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  search(new GfClient(), req.query, Object.values(req.orders()))
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
exports.syncGfClients = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfClientService.syncGfClients(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getGfClientsId = function (req, res) {
  const id = req.swagger.params.id.value;
  GfClientService.getGfClientsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.postGfClients = function (req, res) {
  GfClientService.postGfClients(req.swagger.params.body.value, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.putGfClientsId = function (req, res) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  GfClientService.putGfClientsId(body, id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.downloadDocument = async function (req, res) {
  const id = req.swagger.params.id.value;

  utils.writeFile(res, await GfClientService.downloadDocument(id));
};

exports.uploadDocument = function (req, res) {
  GfClientService.uploadDocument(
    req.files.document,
    req.user.id,
    req.body.clientId,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.syncToAire = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.syncClientToAire(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.aireToLocal = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.aireToLocal(id, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.importContracts = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.importContracts(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
exports.checkDiscounts = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.checkDiscounts(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.setUnpaid = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfClientService.setUnpaid(id, req.body, req.user.userId);
  },
});

exports.resumeUnpaid = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return GfClientService.resumeUnpaid(id, req.user.userId, req.body.reason);
  },
});

exports.aireRequestLines = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.aireRequestLines(id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.cancelAireRequestLine = function (req, res) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;

  GfClientService.cancelAireRequestLine(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.generateDocument = function (req, res) {
  GfClientService.generateDocument(req.swagger.params.id.value, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getClientMissingDocs = async function (req, res) {
  try {
    const missings = await GfDocumentService.getClientMissingDocs(
      req.swagger.params.id.value,
    );
    utils.writeJson(res, respondSuccess({ missings }));
  } catch (error) {
    utils.writeJson(res, error);
  }
};

exports.getClientPhoneNumbersClientId = function (req, res) {
  const id = req.swagger.params.id.value;

  GfClientService.getClientPhoneNumbersClientId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getPersonalDocs = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await GfClientService.getPersonalDocs(id, req.query);
    result.payload.data = result.payload.data.map((obj) => {
      obj.id = `gf-doc:${obj.id}`;
      return obj;
    });

    return result;
  },
});

exports.getContractDocs = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await GfClientService.getContractDocs(id, req.query);
    result.payload.data = result.payload.data.map((obj) => {
      obj.id = `gf-doc:${obj.id}`;
      return obj;
    });

    return result;
  },
});

const removeNullFieldOfOtherDoc = (doc) => {
  switch (doc.type) {
    case 'Delinternet-Documents-GrantPermission': {
      delete doc.GfContractHolderChange;
      delete doc.ChangeBankNumber;
      break;
    }
    case 'Delinternet-Documents-ChangeHolder': {
      delete doc.GrantPermission;
      delete doc.ChangeBankNumber;
      break;
    }
    case 'Delinternet-Documents-ChangeIBAN': {
      delete doc.GfContractHolderChange;
      delete doc.GrantPermission;
      break;
    }
  }
};

exports.getOtherDocs = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await GfClientService.getOtherDocs(id, req.query);
    result.payload.data = result.payload.data.map((obj) => {
      obj.id = `del:${obj.id}`;
      removeNullFieldOfOtherDoc(obj);
      return obj;
    });

    return result;
  },
});

/**
 * @deprecated
 */
exports.getAllDocsLegacy = createRoute({
  async handler(req, res) {
    const { offset, limit, page, size, ...restOfQuery } = req.query; // removing some keys from query for avoiding pagination
    const id = req.swagger.params.id.value;

    const fixId = (prefixId) => (obj) => {
      obj.id = `${prefixId}:${obj.id}`;
      removeNullFieldOfOtherDoc(obj);
      return obj;
    };

    const p = (
      await GfClientService.getPersonalDocs(id, restOfQuery)
    ).payload.data.map(fixId('gf-doc'));

    const c = (
      await GfClientService.getContractDocs(id, restOfQuery)
    ).payload.data.map(fixId('gf-doc'));

    const o = (
      await GfClientService.getOtherDocs(id, restOfQuery)
    ).payload.data.map(fixId('del'));

    return [...p, ...c, ...o];
  },
});

exports.getAllDocs = createRoute({
  async handler(req, res) {
    const { page, size, only } = req.query;
    const id = req.swagger.params.id.value;

    return getAllDocs(id, {
      page: page ?? 1,
      pageSize: size ?? 10,
      only: only ? only.split(',') : null,
    });
  },
});

exports.getContractIdDocs = createRoute({
  async handler(req, res) {
    const { page, size, only } = req.query;
    const id = req.swagger.params.id.value;
    const contractId = req.swagger.params.contractId.value;

    return ContractDocuments.getAllDocs(id, contractId, {
      page: page ?? 1,
      pageSize: size ?? 10,
      only: only ? only.split(',') : null,
    });
  },
});

exports.getSepaDocs = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    return GfClientSepa.getClientSepaDocs(id);
  },
});

exports.getLatestSepaDoc = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const latestSepa = await GfClientSepa.getLatestSepaDoc(id);
    if (!latestSepa) throw new errors.NotFound('Client has not sepa document');
    return latestSepa;
  },
});

exports.getDataProtectionDocs = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const doc = await GfClientDataProtectionDoc.getDataProtectionDoc(id);
    if (!doc) return [];
    return [doc];
  },
});

exports.getGfClientByFiscalId = createRoute({
  async handler(req, res) {
    const client = await GfClient.findOne({
      where: { fiscalId: req.swagger.params.fiscalId.value },
    });

    if (!client) throw new errors.NotFound('Client not found');

    return client.get({ plain: true });
  },
});

exports.exportGfClients = createRoute({
  handler(req, res) {
    return GfClientService.exportGfClients(req, res);
  },
});
