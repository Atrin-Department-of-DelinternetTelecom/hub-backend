// @ts-check
'use strict';

const GfContractSectionStatusService = require('./GfContractSectionStatusService');

const {
  intranet: {
    GfContract,
    GfContractUnpaid,
    GfContractUnpaidTotal,
    transaction,
    GfFeeGroup,
    GfSection,
  },
  AnyModel,
} = require('@models');

const GfCrmContractService = require('./GfCrmContractService');
const GfSectionService = require('./GfSectionService');
const moment = require('moment');
const { default: to } = require('await-to-js');
const assert = require('assert');
const { SECTION_STATUS, CONTRACT } = require('@api/constants/statuses');
const { SERVICE, DATA_FIX_TYPE } = require('@api/constants/contracts');
const {
  findOrFail,
} = require('./Actions/Caches/GfContractSectionStatusCaches');
const { OperationState } = require('./Contract/contracts');
const events = require('./Contract/helpers/events');

const excludedClientIds =
  process.env.UNPAID_EXCLUDED_CLIENT_IDS?.split(',').map((id) => Number(id)) ??
  [];

class AlreadyUnpaidError extends Error {
  constructor() {
    super('ALREADY_UNPAID');
    this.code = 'ALREADY_UNPAID';
  }
}

exports.AlreadyUnpaidError = AlreadyUnpaidError;

/**
 *
 * @param {number} clientId
 * @param {string | null} _initDate
 * @param {string | null} tpvReference
 * @param {number | null} total
 * @param {number | null} totalComision
 * @param {number} userId
 * @param {string} reason
 * @returns
 */
exports.clientUnpaid = async (
  clientId,
  _initDate,
  tpvReference,
  total,
  totalComision,
  userId,
  reason,
) => {
  const initDate =
    typeof _initDate === 'string' &&
    moment(_initDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()
      ? _initDate
      : moment().format('YYYY-MM-DD HH:mm:ss');

  if (excludedClientIds.includes(clientId)) {
    console.log(
      '[UnpaidService]',
      `Skipping unpaid for client ${clientId}. because this client is excluded via env variable`,
    );
    return {
      success: true,
    };
  }

  const contracts = await exports.susceptibleContracts(clientId);
  const contractsUnpaidTotal = await GfContractUnpaidTotal.create({
    tpvReference,
    total,
    totalComision,
  });

  const totalsId = contractsUnpaidTotal.id;

  /** @type {{ alive: any; contract: any }[]} */
  const results = [];

  /** @type {{ error: string; code: string; contract: any }[]} */
  const errors = [];
  let allOk = true;

  for (const c of contracts) {
    try {
      await transaction(async () => {
        const result = await exports.unpaid(
          c.id,
          initDate,
          totalsId,
          userId,
          reason,
        );

        results.push({
          alive: result,
          contract: c,
        });
      });
      // @ts-ignore
    } catch (/** @type {Error} */ e) {
      allOk = false;
      errors.push({
        error: e.toString(),
        code: e.code ?? null,
        contract: c,
      });
    }
  }

  return {
    success: allOk,
    result: results,
    errors,
    reason,
  };
};

/**
 *
 * @param {number} clientId
 * @param {string | null} endDate
 * @param {number} userId
 * @param {string} reason
 * @returns
 */

exports.clientResume = async function (clientId, endDate, userId, reason) {
  const contracts = await exports.susceptibleResumeContracts(clientId);
  /** @type {{ ok: boolean; contractId: number; error: Error | null }[]} */
  const result = [];

  for (const contract of contracts) {
    const [error] = await to(
      transaction(async () => {
        await exports.resume(contract.id, endDate, userId, reason);
      }),
    );
    console.error(error);

    result.push({
      ok: !error,
      contractId: contract.id,
      error,
    });
  }

  return result;
};

/**
 * @param {number} contractId
 * @param {string | null} initDate
 * @param {number | null} totalsId
 * @param {number} userId
 * @param {string} reason
 * @param {boolean} direct
 *
 */
exports.unpaid = async function (
  contractId,
  initDate,
  totalsId,
  userId,
  reason,
  direct = false,
  throughEvent = false,
) {
  initDate =
    typeof initDate === 'string' &&
    moment(initDate, 'YYYY-MM-DD HH:mm:ss', true).isValid()
      ? initDate
      : moment().format('YYYY-MM-DD HH:mm:ss');

  const { status, contract, type, row } = await findOrFail(contractId);
  if (
    !throughEvent &&
    type === SERVICE.FIX &&
    row?.type === DATA_FIX_TYPE.COMPANY
  ) {
    await events.fixCompanyBlockTask(row, userId);
    return { success: true, alive: null };
  }
  const alive = await exports.getAliveOrCreate(contractId, reason);

  if (alive.downState === 'done') {
    throw new AlreadyUnpaidError();
  }

  if (![CONTRACT.ACTIVE, CONTRACT.PENDING_CHANGE].includes(contract.state)) {
    throw new Error('No compatible contract state');
  }

  const originalContractState = contract.state;
  const originalSectionState = status.state;

  let downState = OperationState.DONE;
  if (!direct) {
    const facade = GfSectionService.getFacadeBySectionCode(type);

    const [error, result] = await to(facade.block(contractId, userId));
    if (error) {
      console.error(
        `Failed to execute facade ${type}.block [c:${contractId}]`,
        error,
      );
    }

    downState = error ? OperationState.PENDING : result.state;

    console.log(
      `[UnpaidService][block][contractId:${contractId}]`,
      'state is:',
      {
        downState,
        originalContractState,
        originalSectionState,
      },
    );
  }

  await alive.update({
    downState,
    upState: null,
    originalContractState,
    originalSectionState,
    totalsId,
  });
  await GfCrmContractService.blockStateChanged(alive);

  if (downState === OperationState.DONE)
    await exports.setDownDone(contractId, initDate);

  return {
    success: true,
    alive,
  };
};

/**
 *
 * @param {number} contractId
 * @param {string | null} endDate
 * @param {number} userId
 * @param {string} reason
 * @param {boolean} direct
 * @returns
 */
exports.resume = async function (
  contractId,
  endDate,
  userId,
  reason,
  direct = false,
  throughEvent = false,
) {
  // set contract as unpaid
  const alive = await exports.getAlive(contractId);

  if (!alive) {
    throw new Error('Unpaid row not found');
  }

  if (alive.upState === 'done') {
    throw new Error('Already unblocked');
  }

  const { type, row } = await findOrFail(contractId);
  if (
    !throughEvent &&
    type === SERVICE.FIX &&
    row?.type === DATA_FIX_TYPE.COMPANY
  ) {
    await events.fixCompanyUnBlockTask(row, userId);
    return { success: true, alive };
  }

  /**
   * @type {{ upState: SECTION_STATUS | OperationState, downState: string, error: string | null}}
   */
  const state = {
    upState: SECTION_STATUS.DONE,
    downState: 'revoked',
    error: null,
  };

  if (!direct) {
    const [resumeError, resumeState] = await to(
      getResumeState(contractId, userId),
    );

    if (resumeError) {
      console.error(`Failed to execute facade ${type}.resume`, resumeError);
      state.upState = SECTION_STATUS.PENDING;
      state.error = resumeError.message;
    } else {
      state.upState = resumeState.state;
    }
  }

  console.log(
    `[UnpaidService][resume][contractId:${contractId}]`,
    'state is:',
    state,
  );

  // update unpaid row
  await alive.update(state);
  await GfCrmContractService.blockStateChanged(alive);

  if (state.upState == 'done')
    await exports.setUpDone(contractId, endDate, reason);

  return {
    success: true,
    alive,
  };
};

const getResumeState = async (contractId, userId) => {
  const type = await GfSectionService.getContractSectionCode(contractId);
  assert(
    type,
    `[GfContractsUnpaidService][resume] contract service not found [${contractId}]`,
  );

  const facade = GfSectionService.getFacadeBySectionCode(type);
  console.debug(
    `[GfContractsUnpaidService][resume] executing facade ${type}.resume`,
  );
  return facade.resume(contractId, userId);
};

/**
 *
 * @param {number} contractId
 * @param {string | null} endDate
 * @param {string} reason
 */
exports.setUpDone = async function (contractId, endDate = null, reason) {
  const aliveUnpaid = await exports.getAlive(contractId);
  assert(aliveUnpaid);

  await aliveUnpaid.update({
    upState: 'done',
    end: endDate ? endDate : moment().format('YYYY-MM-DD HH:mm:ss'),
    endReason: reason,
    alive: 0,
  });

  // commented on php code
  //GfCrmManager::blockStateChanged(aliveUnpaid);
  if (aliveUnpaid.originalSectionState == '') {
    throw new Error('No original section state');
  }
  // restore contract states
  const { type } = await GfContractSectionStatusService.findForContract(
    contractId,
  );
  const gfSectionId = await GfSectionService.getSectionIdByCode(type);

  await GfContractSectionStatusService.setState(
    contractId,
    gfSectionId,
    aliveUnpaid.originalSectionState,
    null,
    null,
    0,
  );

  // check contract state to see if it's really changed because I think setState has bug
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `Contract ${contractId} not found`);
  if (contract.state !== aliveUnpaid.originalContractState) {
    const message = `Contract ${contractId} expected to be in state ${aliveUnpaid.originalContractState} but is in state ${contract.state}`;
    // log to both stdout and stderr
    console.error(message);
    console.log(contract);
  }
};

/**
 *
 * @param {number} contractId
 * @param {string=} initDate
 */
exports.setDownDone = async function (contractId, initDate) {
  initDate = initDate ?? moment().format('YYYY-MM-DD HH:mm:ss');
  const aliveUnpaid = await exports.getAlive(contractId);

  await aliveUnpaid?.update({
    downState: 'done',
    upState: '',
    init: initDate,
  });

  // set section as blocked
  const { section, type } =
    await GfContractSectionStatusService.findForContract(contractId);
  const gfSectionId = await GfSectionService.getSectionIdByCode(type);

  await GfContractSectionStatusService.setState(
    contractId,
    gfSectionId,
    'blocked',
    null,
    null,
    0,
  );
};

/**
 * Get unpaid for given contract id or create
 *
 * @param  {number} contractId
 * @return {Promise<AnyModel | null>}
 */
exports.getAlive = async function (contractId) {
  return GfContractUnpaid.findOne({
    where: {
      contractId: contractId,
      alive: 1,
    },
  });
};

/**
 * Get unpaid for given contract id or create
 *
 * @param  {number} contractId
 * @param  {string} reason
 * @return {Promise<AnyModel>}
 */
exports.getAliveOrCreate = async function (contractId, reason) {
  const [instance] = await GfContractUnpaid.findOrCreate({
    where: {
      contractId: contractId,
      alive: 1,
      status: 1,
      startReason: reason,
    },
  });

  return instance;
};

/**
 * Determine if has alive unpaid
 *
 * @deprecated use getAlive
 * @param  {number} contractId
 * @return object|null
 */
exports.isAlive = async function (contractId) {
  const unpaid = await exports.getAlive(contractId);

  return unpaid !== null;
};

/**
 *
 * @param {number} clientId
 * @returns {Promise<any[]>}
 */
exports.susceptibleContracts = async (
  clientId,
  { includeSection } = { includeSection: false },
) => {
  const contracts = await GfContract.findAll({
    where: {
      clientId,
    },
    include: includeSection
      ? {
          model: GfFeeGroup,
          as: 'fee_group',
          include: [
            {
              model: GfSection,
              as: 'sections',
              required: false,
            },
          ],
          required: false,
        }
      : undefined,
  });

  return contracts.filter((contract) =>
    // I have removed "blocked" from this array. because i don't wanna to blocked contracts to susceptible contracts
    ['active', 'pendingChange'].includes(contract.state),
  );
};

/**
 *
 * @param {number} clientId
 * @param {{ includeSection: boolean }} param1
 * @returns
 */
exports.susceptibleResumeContracts = async (
  clientId,
  { includeSection } = { includeSection: false },
) => {
  const contracts = await GfContract.findAll({
    where: {
      clientId,
    },
    include: includeSection
      ? [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: [
              {
                model: GfSection,
                as: 'sections',
                required: false,
              },
            ],
            required: false,
          },
        ]
      : [],
  });

  const result = [];
  for (const c of contracts) {
    const alive = await exports.getAlive(c.id);
    if (!alive) {
      continue;
    }

    result.push(c);
  }

  return result;
};
