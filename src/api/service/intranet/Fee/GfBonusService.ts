import { AnyModel, intranet } from '@models';
import {
  cancelDiscount,
  replaceDiscountActor,
} from '../GfDiscountsExecuteService';
import {
  errorBono,
  getTaskByTrace,
  installBono,
  maskAsCanceled,
  uninstallBono,
} from '../CrmTaskHelperService';

import Bonusable from '../Contract/Facades/Bonusable';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { handle as ReleaseAssignables } from '../Actions/ReleaseAssignables';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { blockContract } from '../RadiusService';
import { checkAssignables } from '../GfContractDataInternetService';
import { checkRule } from '../GfDiscountsPendingService';
import factory from '../Contract/Facades';
import { get } from 'lodash';
import { getContractSectionCode } from '../GfSectionService';
import { getFromClient } from '../GfContractService';
import { isContractBlocked } from '../../unpaid/UnpaidContractService';
import moment from 'moment';
import { throwIf } from '@api/utils/helpers';

const {
  GfBonusContractXref,
  GfBonusHistory,
  GfContract,
  GfBonusScheduled,
  GfBonosFixValues,
  InvoiceProduct,
  GfFixCallTypes,
  GfBonoLabel,
  GfDiscountsExecutedUsage,
  GfDiscountsExecuted,
  GfDiscountsMatrix,
  MatrixReplacementCombinationSet,
  MatrixReplacementCombinationRule,
  GfDiscountsMatrixRule,
} = intranet;

export const getBonosForFeeGroup = function (feeGroupId: number) {
  return GfBonus.findAll({
    include: [
      {
        model: GfFeeGroup,
        as: 'feeGroups',
        required: true,
        where: {
          id: feeGroupId,
        },
      },
    ],
  });
};

export const addBonus = async function (
  contractId: number,
  bonusId: number,
  direct: boolean,
  promotion: boolean,
  ip: string,
  userId: number,
) {
  throwIf(
    Boolean(await isContractBlocked(contractId)),
    'Is not possible to add bonus to the blocked contract',
  );

  const bonus = await GfBonus.findByPk(bonusId);

  if (bonus === null) throw new Error('Bono not found');

  if (bonus.internetIpFix === 1) {
    const dataInternet = await GfContractDataInternet.findOne({
      where: { contractId },
    });

    assert(dataInternet, `data internet info not found`);

    const old = dataInternet.get({ plain: true });

    // update contract data with staticIp
    await dataInternet.update({
      staticIp: ip,
      radiusProfileSufix: 'M',
    });

    await checkAssignables(dataInternet, userId, old);
  }

  const xref = await GfBonusContractXref.create({
    bonoId: bonus.id,
    contractId: contractId,
    autoRenew: bonus.autoRenew,
    prorotable: bonus.prorotable,
    promotional: promotion ? 1 : 0,
    state: 'pendingActivation',
    userId: userId,
  });

  if (!direct && bonus.needTechnicalAction()) {
    await installBono(xref.id, userId);
    return xref.id;
  }

  await activate(xref.id, null, false, userId);
  if (bonus.affectRadius())
    await activateAllErroredRadiusBonos(contractId, userId);
  return xref.id;
};

export const activate = async function (
  xrefId: number | null,
  allFromContractId: number | null,
  ignoreRadius = false,
  userId: number,
) {
  const wheres = xrefId ? { id: xrefId } : { contractId: allFromContractId };

  const xrefs = await GfBonusContractXref.scope([
    'pendingActivation',
    'defaultScope',
  ]).findAll({ where: wheres });

  if (xrefs.length === 0) {
    return { success: true, reason: 'Bono(s) has been removed' };
  }
  const { contractId, bonoId } = xrefs[0];
  const histories = await makeActivateHistories(xrefs);
  const sectionCode = await getContractSectionCode(contractId);
  const facade = factory(sectionCode!);
  // Check if the bonus needs to be applied on an external service
  if (!(facade instanceof Bonusable)) {
    return { success: true, reason: 'Bonus activated successfully.' };
  }
  // Attempt to apply the bonus on the service
  try {
    await facade.activateBonus(contractId, bonoId, { ignoreRadius });
  } catch (error) {
    // Restore previous state in case of an error
    await restoreActivates(xrefs, userId);
    await GfBonusHistory.destroy({ where: { id: histories } });
    throw error;
  }

  return { success: true, reason: 'Bonus activated successfully.' };
};

export const activateAllPending = function (
  contractId: number,
  userId: number,
) {
  return activate(null, contractId, false, userId);
};

const makeActivateHistories = async function (xrefs: AnyModel[]) {
  const histories: number[] = [];

  for (const item in xrefs) {
    await xrefs[item].setAsDone();

    const history = await GfBonusHistory.create({
      xrefId: xrefs[item].id,
      bonoId: xrefs[item].bonoId,
      contractId: xrefs[item].contractId,
      initDate: moment().format('YYYY-MM-DD'),
    });

    histories.push(history.id);
  }

  return histories;
};

const restoreActivates = async function (xrefs: AnyModel[], userId: number) {
  for (const item in xrefs) {
    await xrefs[item].setAsPendingActivation();

    await errorBono(xrefs[item].id, userId);
  }
};

/**
 * Activate GfBonusContractXref that has error for given contract id
 */
const activateAllErroredRadiusBonos = async function (
  contractId: number,
  userId: number,
) {
  const xrefs = await GfBonusContractXref.scope([
    'pendingActivation',
    'defaultScope',
  ]).findAll({
    where: {
      contractId: contractId,
    },
    include: [
      {
        model: GfBonus,
        as: 'bonus',
      },
    ],
  });

  const callback = async (xref: AnyModel) => {
    // activate bono
    await activate(xref.id, null, true, userId);

    // cancel event if any
    await maskAsCanceled(`errorBono_${contractId}/${xref.id}_INTERNET`);
  };

  await Promise.all(
    xrefs
      .filter((xref) => xref.bonus?.affectRadius())
      .map((xref) => callback(xref)),
  );
};

/**
 * Add bonus to the given contract id.
 * */
export const removeBonus = async function (
  xrefId: number,
  direct = false,
  dontValidate = false,
  userId: number,
) {
  const xref = await GfBonusContractXref.findByPk(xrefId, {
    include: [
      {
        model: GfBonus,
        as: 'bonus',
      },
    ],
  });

  assert(xref, 'No bonus found for this contract');

  // remove staticIp
  if (xref.bonus.internetIpFix === 1) {
    await ReleaseAssignables(
      await GfContract.findAll({ where: { id: xref.contractId } }),
      userId,
    );
    await GfContractDataInternet.update(
      { staticIp: null },
      { where: { contractId: xref.contractId } },
    );
  }

  if (!dontValidate) {
    // check if it is part of a scheduled
    const bonusScheduled = await GfBonusScheduled.findOne({
      where: {
        bonusContractXrefId: xrefId,
      },
    });
    if (bonusScheduled !== null) {
      throw new Error(
        'This bonos is part of an scheduled bono, remove scheduled bono',
      );
    }
  }

  // TODO
  // start transaction

  direct = xref.isPendingActivation();

  await xref.update({
    state: xref.isPendingDeactivation() ? 'done' : 'pendingDeactivation',
  });

  if (direct || !xref?.bonus.needTechnicalAction()) {
    await deactive(xrefId, userId);
  }

  await uninstallBono(xrefId, userId);

  // end transaction
  const asUsages = await GfDiscountsExecutedUsage.findAll({
    where: {
      typeId: xrefId,
      type: 'contract-bono',
    },
    include: [
      {
        model: GfDiscountsExecuted,
        as: 'executed',
        include: [
          {
            model: GfDiscountsMatrix,
            as: 'matrix',
            include: [
              {
                model: MatrixReplacementCombinationSet,
                as: 'combinationSets',
                required: false,
                include: [
                  {
                    model: MatrixReplacementCombinationRule,
                    as: 'combinationSetRules',
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  const executeds: AnyModel[] = [];
  const executedsUnique: Record<string, boolean> = {};
  for (const asUsage of asUsages) {
    if (!executedsUnique[asUsage.executedId]) {
      executedsUnique[asUsage.executedId] = true;
      executeds.push(asUsage.executed);
    }
  }

  const futureUsagesReleased: AnyModel[] = [];
  const futureUsagesReleasedUnique: Record<string, boolean> = {};
  for (const executed of executeds) {
    await GfDiscountsExecutedUsage.findAll({
      where: {
        executedId: executed.id,
        type: 'contract-bono',
      },
    }).then((items) => {
      for (const item of items)
        if (!futureUsagesReleasedUnique[item.id]) {
          futureUsagesReleasedUnique[item.id] = true;
          futureUsagesReleased.push(item);
        }
    });
  }

  for (const executed of executeds) {
    // search for a substitute
    const _futureUsagesReleased: AnyModel[] = [];

    for (const usage of futureUsagesReleased)
      if (usage.executedId === executed.id) _futureUsagesReleased.push(usage);

    const result = await searchBonoSubstitutiveActor(
      executed,
      xrefId,
      _futureUsagesReleased,
    );

    if (result.success) {
      await replaceDiscountActor(executed, result.replacements);
    } else {
      await cancelDiscount(executed, true, undefined, userId);
    }
  }

  return xref;
};

const searchBonoSubstitutiveActor = async (
  executed: AnyModel,
  xrefId: number,
  futureUsagesReleased: AnyModel[],
) => {
  const replacements: { fromTypeId: number; toTypeId: number; type: string }[] =
    [];

  //@ts-ignore
  const contract: AnyModel = await GfContract.findByPk(
    executed.targetContractId,
  );
  const clientContracts: AnyModel[] = await getFromClient(
    contract?.clientId,
    false,
    false,
    true,
  ).then((contracts: AnyModel[]) => {
    // only active contracts
    return contracts.filter((contract) => contract.isActive());
  });

  //find last usage of actor
  const bonusUsage = await GfDiscountsExecutedUsage.findOne({
    where: {
      executedId: executed.id,
      type: 'contract-bono',
      typeId: xrefId,
    },
    order: [['id', 'DESC']],
  });
  if (!bonusUsage) return { success: false, replacements };

  const bonoRule: AnyModel | null = await GfDiscountsMatrixRule.findByPk(
    bonusUsage.ruleId,
  );
  if (!bonoRule) return { success: false, replacements };
  const checkRuleRes = await checkRule(
    bonoRule,
    clientContracts,
    contract,
    false,
    moment(),
    //@ts-ignore
    futureUsagesReleased,
  );
  const bonoXrefTypeId = get(checkRuleRes, '0.typeId') as number | undefined;
  if (!bonoXrefTypeId) return { success: false, replacements };
  replacements.push({
    fromTypeId: bonusUsage.typeId,
    type: 'contract-bono',
    toTypeId: bonoXrefTypeId,
  });

  return {
    success: true,
    replacements,
  };
};

export const deactive = async function (xrefId: number, userId: number) {
  const xref = await GfBonusContractXref.findByPk(xrefId);

  assert(xref, 'No bono found for this contract');
  const isBlockedContract = Boolean(await isContractBlocked(xref.contractId));

  // TODO
  // start transaction

  // first make history
  await GfBonusHistory.update(
    { endDate: moment().format('YYYY-MM-DD') },
    { where: { xrefId } },
  );
  // then remove bonus
  await xref.update({ status: 0 });

  // if internet do
  const sectionCode = await getContractSectionCode(xref.contractId);
  const facade = factory(sectionCode!);

  if (facade instanceof Bonusable) {
    await facade.deactivateBonus(xref.contractId, xref.bonoId, { userId });
  }
  // to ensure radius stay block
  if (sectionCode === SERVICE.INTERNET && isBlockedContract) {
    await blockContract(xref.contractId);
  }

  // cancel errorBono event if any
  const trace = `errorBono_${xref.contractId}/${xref.id}_${sectionCode}`;
  const event = await getTaskByTrace(trace);

  // cancel task
  if (event && !event.executed) await maskAsCanceled(trace);

  // TODO
  // end transaction

  return;
};

export const getContractBonos = async function (contractId: number) {
  const bonuses = await GfBonus.findAll({
    include: [
      {
        model: GfContract,
        as: 'contracts',
        required: true,
        through: { where: { contractId } },
      },
      {
        model: GfBonoLabel,
        as: 'labels',
        required: false,
      },
    ],
  });

  const bonos = [];

  for (const bonus of bonuses)
    bonos.push({
      description: bonus.name,
      type: 'local',
      contractId: contractId,
      xrefId: bonus.contracts![0].GfBonusContractXref.id,
      state: bonus.contracts![0].state,
      bonoId: bonus.id,
      promotional: bonus.promotional,
      promotionalEndDate: bonus.promotionalEndDate,
      discountExecutedId: bonus.discountExecutedId,
      labels: bonus.labels,
    });

  return bonos;
};

const fixCalculation = async (bonoId: number) => {
  const result: Record<string, number> = {};

  const types = await GfFixCallTypes.findAndCountAll({ raw: true });
  for (const type of types.rows) {
    const row = await GfBonosFixValues.findOne({
      where: {
        bonoId,
        fixTypeId: type.id,
      },
    });

    result['fix_' + type.id + '_minutes'] = row ? row.minutes : 0;
  }

  return result;
};

export const setFixValues = async function (data: AnyModel) {
  const fix = await fixCalculation(data.id);

  const types = await GfFixCallTypes.findAndCountAll({ raw: true });
  for (const type of types.rows) {
    const row = await GfBonosFixValues.findOne({
      where: {
        bonoId: data.id,
        fixTypeId: type.id,
      },
    });

    if (row) {
      await row.update({
        minutes: fix['fix_' + type.id + '_minutes'],
      });

      continue;
    }

    await GfBonosFixValues.create({
      bonoId: data.id,
      fixTypeId: type.id,
      minutes: fix['fix_' + type.id + '_minutes'],
    });
  }
};

export const syncInvoice = async function (data: AnyModel) {
  const bono = await GfBonus.findOne({
    where: {
      id: data.id,
    },
  });

  assert(bono, 'bono not found');

  if (bono.tpvCode && bono.tpvCode != '') {
    const invoiceProduct = await InvoiceProduct.findOne({
      where: {
        code: data.tpvCode,
        status: 1,
      },
    });

    if (invoiceProduct) {
      invoiceProduct.refererApp = 'goufone';
      invoiceProduct.refererKey = 'bono_' + bono.id;
      invoiceProduct.refererData = '';
      invoiceProduct.name = bono.name;
      invoiceProduct.description = bono.description;
      invoiceProduct.includedTaxs = 0;
      invoiceProduct.InvoiceProducts_taxes_option_1 = 'on';
      invoiceProduct.price = bono.pvp;
      delete invoiceProduct.noBillable;

      await invoiceProduct.save();

      return {
        success: true,
      };
    }
  }

  const tpvCode = bono.tpvCode ? bono.tpvCode : 'BONO/' + bono.id;
  const invoiceProduct = await InvoiceProduct.findOne({
    where: {
      code: tpvCode,
      status: 1,
    },
  });

  let result;
  if (invoiceProduct) {
    invoiceProduct.refererApp = 'goufone';
    invoiceProduct.refererKey = 'bono_' + bono.id;
    invoiceProduct.refererData = '';
    invoiceProduct.name = bono.name;
    invoiceProduct.description = bono.description;
    invoiceProduct.includedTaxs = 0;
    invoiceProduct.InvoiceProducts_taxes_option_1 = 'on';
    invoiceProduct.price = bono.pvp;
    delete invoiceProduct.noBillable;

    result = await invoiceProduct.save();
  } else {
    result = await InvoiceProduct.create({
      refererApp: 'goufone',
      refererKey: 'bono_' + bono.id,
      refererData: '',
      name: bono.name,
      description: bono.description,
      includedTaxs: 0,
      price: bono.pvp,
      code: tpvCode,
    });
  }

  if (result) {
    bono.tpvCode = result.code;
    await bono.save();
  }

  return {
    success: true,
  };
};
