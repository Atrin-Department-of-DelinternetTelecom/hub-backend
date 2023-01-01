import * as GfFeeService from './Fee/GfFeeService';

import { AnyModel, intranet } from '@models';
import {
  execute,
  setDoneState,
  setErrorState,
} from './GfContractSectionStatusService';
import { firstPopulated, throwIf } from '@api/utils/helpers';
import { getFacadeBySectionCode, getSectionIdByCode } from './GfSectionService';

import { FacadeInternet } from './Contract/Facades';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { Op } from 'sequelize';
import RadiusService from './RadiusService';
import { SECTION_STATUS } from '@api/constants/statuses';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { cleanObject } from '@utils/tools';
import { getActualConditionsBySection } from './GfContractService';
import moment from 'moment';

const {
  GfBonus,
  GfBonusContractXref,
  GfContract,
  GfContractSectionStatus,
  GfSection,
  transaction,
} = intranet;

export const getRadiusInfo = async function (contractId: number) {
  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId,
    },
  });

  if (dataInternet === null) {
    return {
      success: false,
      reason: 'Bad contractId',
    };
  }

  const contract = await GfContract.findByPk(contractId);
  assert(contract, `Contract with id:${contractId} not found`);

  const conditions = await GfFeeService.getActualConditions(
    contract.feeGroupId,
  );

  // check radius exclusion
  if (RadiusService.excludeFromRadius(conditions)) {
    return {
      success: true,
      state: 'ok',
      reason: 'Not need',
      radiusGroup: {
        string: '-',
        check: {
          success: true,
          checked: '-',
        },
      },
    };
  }

  // do the job
  const mustHaveRadiusGroup = await calculateRadiusGroup(contractId);

  // contract is pending
  // send only mustHave
  if (dataInternet.nodeRadiusName == '' && dataInternet.node == '') {
    return {
      success: true,
      state: 'pending',
      mustHave: mustHaveRadiusGroup,
    };
  }
  // get real radius data
  const userInfo = await RadiusService.getUserData(
    dataInternet.nodeRadiusName as string,
    dataInternet.node,
  );

  if (!userInfo.success) {
    // user not found on radius
    return {
      success: true,
      reason: userInfo,
      state: 'error',
      mustHave: mustHaveRadiusGroup,
    };
  }
  const {
    data: { data, cached },
  } = userInfo;

  const isMulti =
    Number(userInfo.data.data.connection?.data?.Active_connections) > 0;

  let state: 'ok' | 'warning' = 'ok';
  let reason: string | undefined;

  if (
    dataInternet.hasSameRadiusUser(data) &&
    userInfo.data.data.general?.speed_up == mustHaveRadiusGroup.up &&
    userInfo.data.data.general?.speed_down == mustHaveRadiusGroup.down
  ) {
    state = 'ok';
  } else {
    state = 'warning';
    reason = "Users found don't match local data";
  }

  return {
    success: true,
    radiusData: userInfo,
    mustHave: mustHaveRadiusGroup,
    isMulti,
    state,
    reason,
  };
};

const calculateRadiusGroup = async function (contractId: number) {
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `Contract with id:${contractId} not found`);

  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId,
    },
  });
  assert(
    dataInternet,
    `GfContractDataInternet with contractId:${contractId} not found`,
  );

  const conditions = await GfFeeService.getActualConditions(
    contract.feeGroupId,
  );
  const sufix = firstPopulated([dataInternet.radiusProfileSufix], 'MP');

  let includedMb = conditions.internetIncludedMb;
  let includedUpMb = conditions.internetIncludedUpMb;
  let staticIp = false;

  if (includedMb > 0) {
    const result = await calculateRadiusGroupFromBonuses(contractId);
    includedMb += result.includedMb;
    includedUpMb += result.includedUpMb;
    staticIp = result.staticIp;
  }

  return {
    success: true,
    radiusGroup: includedMb + sufix,
    up: includedUpMb,
    down: includedMb,
    isPrivate: sufix === 'MP',
    staticIp: staticIp,
  };
};

const calculateRadiusGroupFromBonuses = async function (contractId: number) {
  const xrefs = await GfBonusContractXref.findAll({
    where: {
      contractId: contractId,
    },
    include: [
      {
        model: GfBonus,
        as: 'bonus',
        required: true,
      },
    ],
  });

  const result = {
    staticIp: false,
    includedMb: 0,
    includedUpMb: 0,
  };

  for (const item of xrefs) {
    result.includedMb = result.includedMb + item.bonus.internetMbIncluded;
    result.includedUpMb = result.includedUpMb + item.bonus.internetUpMbIncluded;
    result.staticIp = item.bonus.internetIpFix === 1 ? true : result.staticIp;
  }

  return result;
};

export const getTechnology = async function (contractId: number) {
  const conditions = await getActualConditionsBySection(contractId);

  return conditions.internetTechnology;
};

export const doRadiusOperations = async function (contractId: number) {
  return FacadeInternet.doRadius(contractId);
};

export const getRadiusGroup = async function (contractId: number) {
  const radiusGroup = await calculateRadiusGroup(contractId);

  if (!radiusGroup.success) return radiusGroup;

  return {
    success: true,
    radiusGroup: radiusGroup.radiusGroup,
    up: radiusGroup.up,
    down: radiusGroup.down,
    isPrivate: radiusGroup.isPrivate,
    staticIp: radiusGroup.staticIp,
  };
};

export const removeCpe = async function (cpeDeviceId: string, userId: number) {
  const dataInternets = await GfContractDataInternet.findAll({
    where: { cpeDeviceId },
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
      },
    ],
  });

  for (const dataInternet of dataInternets) {
    await dataInternet.update({
      cpeDeviceId: null,
      cpeId: null,
      cpeSn: null,
    });

    const sectionId = await getSectionIdByCode('INTERNET');

    await execute(dataInternet.contractId, sectionId, userId);
  }

  return { success: true };
};

export const addCpeLimit = async function () {
  // ATTENTION
  // we dont use phicus service, so ignored.
  return {
    success: true,
    reason: 'Not needed',
    state: 'ok',
  };
};

export const getCpeInfo = async function (
  dataInternet: AnyModel,
  radiusInfo: Record<string, any>,
) {
  // ATTENTION
  // we dont use phicus service, so ignored.
  return {
    success: true,
    reason: 'Not needed',
    state: 'ok',
  };
};

export const doCpeProvision = async function () {
  // ATTENTION
  // we dont use phicus service, so ignored.
  return {
    success: true,
    reason: 'Not needed',
    state: 'ok',
  };
};

function getStateWaitingForRadius() {
  return GfContractDataInternet.findAll({
    include: [
      {
        model: GfContract,
        as: 'contract',
        attributes: [],
        include: [
          {
            model: GfContractSectionStatus,
            as: 'statuses',
            attributes: [],
            where: {
              state: 'pending',
              pendingState: 'waitingRadius',
            },
          },
        ],
      },
    ],
  });
}

export const checkFirstConnection = async function ({
  sectionId,
  forceFirstConnectionAt,
  userId,
}: {
  sectionId?: number;
  forceFirstConnectionAt?: Date;
  userId?: number;
} = {}) {
  const entities = sectionId
    ? await GfContractDataInternet.findAll({ where: { id: sectionId } })
    : await getStateWaitingForRadius();

  const activated: number[] = [];

  const sectionTypeId = await getSectionIdByCode('INTERNET');

  for (const { nodeRadiusName, contractId } of entities) {
    if (nodeRadiusName === null) {
      console.warn(
        `Node radius name is null for contractId ${contractId}, skipping...`,
      );
      continue;
    }
    const activity = await RadiusService.searchActivity(
      nodeRadiusName as string,
    );
    const dateActivation = forceFirstConnectionAt ?? activity?.first;
    if (!dateActivation) continue;

    // activate!
    await transaction(async () => {
      const contract = await GfContract.findByPk(contractId);
      assert(contract);

      await contract.update({
        // do not change dateActivation if already exist
        dateActivation: contract.dateActivation ?? dateActivation,
      });

      await setDoneState(contractId, sectionTypeId, userId ?? 1);
    });

    activated.push(contractId);
  }

  return {
    activated,
  };
};

export const checkExecutedStates = async function ({
  contractId,
  userId = 0,
}: {
  contractId?: number;
  userId?: number;
} = {}) {
  const statuses = await GfContractSectionStatus.findAll({
    where: cleanObject({
      creationDate: {
        [Op.gt]: moment().subtract(3, 'months').toDate(),
      },
      state: SECTION_STATUS.EXECUTED,
      // if limited by certain contract
      contractId: contractId ? contractId : undefined,
    }),
    order: [['id', 'desc']],
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
      },
      {
        model: GfSection,
        as: 'section',
        required: true,
      },
    ],
  });

  throwIf(
    contractId !== undefined && statuses.length === 0,
    `Contract state executed not found (${contractId})`,
  );

  for (const status of statuses) {
    if (status.section.code === SERVICE.CELL) continue;

    const facade = getFacadeBySectionCode(status.section.code);
    const facadeState = await facade.getState(status.contractId);

    if (facadeState.state === 'done') {
      console.warn(
        `State cahnged to 'done' from 'executed' for contract ${status.contractId} by CRON service`,
      );
      await setDoneState(status.contractId, status.sectionId, userId);
    }
    if (facadeState.state === 'error') {
      console.warn(
        `State cahnged to 'error' from 'executed' for contract ${status.contractId} by CRON service`,
      );
      //TODO
      //GfAlertsManager::create("checkExecutedStates", "section has an error", $s);
      await setErrorState(
        status.contractId,
        status.sectionId,
        //@ts-ignore
        facadeState.reason,
        userId,
      );
    }
  }
};
