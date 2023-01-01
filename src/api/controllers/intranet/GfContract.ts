import * as GfContractButtonsService from '@service/intranet/GfContractButtonsService';
import * as GfContractDataCellService from '@service/intranet/GfContractDataCellService';
import * as GfContractDataFixService from '@service/intranet/GfContractDataFixService';
import * as GfContractDataInternetService from '@service/intranet/GfContractDataInternetService';
import * as GfContractDataTvService from '@service/intranet/GfContractDataTvService';
import * as GfContractService from '@service/intranet/GfContractService';
import * as GfContractsUnpaidService from '@api/service/intranet/GfContractsUnpaidService';
import * as GfInstallationEvaluationFormService from '@service/intranet/GfInstallationEvaluationFormService';
import * as GfSimDeliveryService from '@service/intranet/GfSimDeliveryService';
import * as UnpaidContractService from '@service/unpaid/UnpaidContractService';
import * as utils from '@utils/writer';

import {
  fixCompanyBlockTask,
  fixCompanyUnBlockTask,
} from '@api/service/intranet/Contract/helpers/events';

import assert from 'assert';
import { createRoute } from '@api/utils/controller-factory';
import { errors } from '@api/http/http_errors';
import { getReportByContractId } from '@api/service/technician';
import { intranet } from '@api/models';
import { loadDocumentSignatures } from '@api/service/documents/DocumentService';
import { search } from '@api/service/intranet/SearchService';

const { GfContract, GfContractDataFix } = intranet;

const { fromEntries, entries } = Object;
export const fixUnpaidContracts = function (req, res, next) {
  UnpaidContractService.fixUnpaidContracts()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const deleteGfContractsId = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.destoryGfContractsId(id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
export const getGfContracts = function (req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfContractService.getGfContracts(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getGfContractDataFixInternets = function (req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfContractService.getGfContractDataFixInternets(
    req.swagger.params.clientId.value,
    req.query,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const searchGfContracts = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  search(new GfContract(), req.query, Object.values(req.orders()))
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
export const syncGfContracts = function (req, res) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  GfContractService.syncGfContracts(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getGfContractsId = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.getGfContractsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const postGfContracts = function (req, res, next) {
  GfContractService.postGfContracts(req.body, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const putGfContractsId = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.putGfContractsId(req.body, id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getEvaluationForm = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfInstallationEvaluationFormService.getByContractId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getDataCell = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataCellService.getByContractId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getDataFix = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataFixService.getByContractId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
export const getDataInternet = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataInternetService.getByContractId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      console.log(response);
      utils.writeJson(res, response);
    });
};

export const getDataTv = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractDataTvService.getByContractId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const changeFeeGroup = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.changeFeeGroup(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const bulkChangeFeeGroup = function (req, res) {
  GfContractService.bulkChangeFeeGroup(req.body, req.user?.userId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const revertBulkChangeFeeGroup = function (req, res) {
  GfContractService.revertBulkChangeFeeGroup(req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const changeHolder = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.changeHolder(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const addBonus = function (req, res, next) {
  const id = req.swagger.params.id.value;
  const bonusId = req.swagger.params.bonusId.value;
  GfContractService.addBonus(id, bonusId, req.body.ip, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const removeBonus = function (req, res, next) {
  const id = req.swagger.params.id.value;
  const bonusId = req.swagger.params.bonusId.value;
  GfContractService.removeBonus(id, bonusId, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const newUserQuery = function (req, res, next) {
  const body = req.swagger.params.body.value;
  GfContractButtonsService.newUserQuery(
    body.contractId,
    body.name,
    body.text,
    req.user.id,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const newTecnicAction = function (req, res, next) {
  const body = req.swagger.params.body.value;
  GfContractButtonsService.newTecnicAction(
    body.contractId,
    body.name,
    body.text,
    req.user.id,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const newInstallation = function (req, res, next) {
  const body = req.swagger.params.body.value;
  GfContractButtonsService.newInstallation(
    body.contractId,
    body.name,
    body.text,
    req.user.id,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const newCustomAdministrativeAction = function (req, res, next) {
  const body = req.swagger.params.body.value;
  GfContractButtonsService.newCustomAdministrativeAction(
    body.contractId,
    body.name,
    body.text,
    req.user.id,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const newCustomInternalQuery = function (req, res, next) {
  const body = req.swagger.params.body.value;
  GfContractButtonsService.newCustomInternalQuery(
    body.contractId,
    body.name,
    body.text,
    req.user.id,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const executeIvoz = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.executeIvoz(id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const executeOperadors = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.executeOperadors(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
export const getOperadorsStatus = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.getOperadorsStatus(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getIvozRegisterStatus = async (req, res) => {
  const id = req.swagger.params.id.value;
  try {
    const result = await GfContractDataFixService.getIvozRegisterStatus(id);
    utils.writeJson(res, result);
  } catch (e) {
    utils.writeJson(res, e);
  }
};

export const getRadiusInfo = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.getRadiusInfo(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const getCpeInfo = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.getCpeInfo(id, req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const doRadius = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.doRadius(id, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const searchRadius = function (req, res, next) {
  GfContractService.searchRadius(req.body, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const doCpeAction = function (req, res, next) {
  const id = req.swagger.params.id.value;
  const action = req.swagger.params.action.value;
  GfContractService.doCpeAction(id, action)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const pingCpe = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfContractService.pingCpe(id);
  },
});

export const execute = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.execute(id, req.body.section, req.user?.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const aireBonuses = function (req, res, next) {
  const id = req.swagger.params.id.value;
  GfContractService.aireBonuses(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

export const block = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfContractsUnpaidService.unpaid(
      id,
      null,
      null,
      req.user?.userId,
      req.body.reason,
    );
  },
});

export const resume = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfContractsUnpaidService.resume(
      id,
      null,
      req.user?.userId,
      req.body.reason,
    );
  },
});

export const blockTask = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const datafix = await GfContractDataFix.findOne({
      where: { contractId: id },
    });
    assert(datafix, 'datafix not found');
    return fixCompanyBlockTask(datafix, req.user?.userId);
  },
});

export const unblockTask = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const datafix = await GfContractDataFix.findOne({
      where: { contractId: id },
    });
    assert(datafix, 'datafix not found');
    return fixCompanyUnBlockTask(datafix, req.user?.userId);
  },
});

export const getInstallationReport = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;

    const report = await getReportByContractId(
      ['installation/fibra', 'installation/radio'],
      id,
    );
    const signs = await loadDocumentSignatures(report.docId);

    return {
      ...report,
      signatures: fromEntries(
        entries(signs).map(([k, v]) => [k, v?.toString('base64')]),
      ),
    };
  },
});

export const getUnpaidState = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const result = await GfContractDataCellService.getUnpaidState(id);

    return result;
  },
});

export const exportGfContracts = createRoute({
  handler(req, res) {
    return GfContractService.exportGfContracts(req, res);
  },
});

export const importAireLine = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfContractService.importAireLine(id, req.user?.userId);
  },
});

export const importContract = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfContractService.importContract(id, req.user?.userId);
  },
});

export const getSimDelivery = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const result = await GfSimDeliveryService.getContractSimDelivery(id);
    if (!result) throw new errors.NotFound(`this contract has no sim delivery`);
    return result;
  },
});

export const putSimDelivery = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return GfSimDeliveryService.putGfSimDelivery(id, req.body, req.user);
  },
});

export const getCdrs = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return GfContractService.getCdrs(id, {
      ...req.query,
      url:
        req.protocol +
        '://' +
        req.get('host') +
        req.url.slice(0, req.url.indexOf('?')),
    });
  },
});

export const getCdrReports = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;

    return GfContractService.getCdrReports(id, {
      ...req.query,
      url:
        req.protocol +
        '://' +
        req.get('host') +
        req.url.slice(0, req.url.indexOf('?')),
    });
  },
});

export const destroyIvoz = createRoute({
  handler(req) {
    return GfContractService.destroyIvoz(req.swagger.params.id.value, req.user);
  },
});

export const needsFactoryReset = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;

    const result = await GfContractService.needsFactoryReset(id);

    return {
      needsFactoryReset: result,
    };
  },
});

export const suspendUnpaidCustomers = createRoute({
  async handler() {
    await GfContractService.suspendUnpaidCustomers();
  },
});

export const forceState = createRoute({
  async handler(req) {
    return GfContractService.forceState(
      req.body,
      req.swagger.params.id.value,
      req.user,
    );
  },
});

export const getContractsWithInvalidInternetSection = createRoute({
  async handler(req) {
    return GfContractService.getContractsWithInvalidInternetSection(req.query);
  },
});

export const getGfContractBySerialNumber = createRoute({
  async handler(req) {
    return GfContractService.getGfContractBySerialNumber(
      req.swagger.params.sn.value,
    );
  },
});

export const reactivate = createRoute({
  handler(req) {
    return GfContractService.reactivate(req.swagger.params.id.value, req.user);
  },
});

export const ensureOfDocument = createRoute({
  handler(req) {
    return GfContractService.ensureOfDocumentByContractId(
      req.swagger.params.id.value,
    );
  },
});

export const saveCpeSnByContractId = createRoute({
  async handler(req) {
    const id = req.swagger.params.contractId.value;
    const { cpeSn } = req.body;

    return GfContractService.saveCpeSnByContractId(id, cpeSn, req.user);
  },
});
