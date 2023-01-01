import { AnyModel, intranet } from '@models';
import { CreateAndUpdateFeeBody, dataSectionValidationFunction } from './types';

import { FeeInitialFee } from '@api/models/intranet/intranet_fee_initial_fee';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { Op } from 'sequelize';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import moment from 'moment';
import { syncMtoN } from '@api/utils/sequelize';

const {
  GfFixCallTypes,
  GfFeesFixValue,
  InvoiceProduct,
  InvoiceTaxType,
  InvoiceProductTaxXref,
} = intranet;

const validateFee = async (newFee: CreateAndUpdateFeeBody) => {
  const { feeGroupId } = newFee;
  const feeGroup = await GfFeeGroup.findByPk(feeGroupId, {
    include: {
      model: GfSection,
      as: 'sections',
    },
  });

  if (!feeGroup) return false;

  return FeeSectionDataValidator[feeGroup.sections![0].code as SERVICE](newFee);
};

export const validateAndSanitizeFee = async function validateAndSanitizeFee(
  newFee: CreateAndUpdateFeeBody,
) {
  const validate = await validateFee(newFee);
  if (!validate) return false;

  Object.keys(newFee).forEach((key) => {
    const value = newFee[key as keyof CreateAndUpdateFeeBody];
    if (key === 'applicableService') {
      newFee[key as keyof CreateAndUpdateFeeBody] = Object.values(
        SERVICE,
      ).includes(value)
        ? value
        : null;
      return;
    }

    if (typeof value !== 'boolean' && !value && value !== 0) {
      delete newFee[key as keyof CreateAndUpdateFeeBody];
    }
  });

  return true;
};

const validateNewInternetFee = (newInternetFee: CreateAndUpdateFeeBody) => {
  return (
    'internetIncludedMb' in newInternetFee &&
    'internetIncludedUpMb' in newInternetFee &&
    'internetTechnology' in newInternetFee
  );
};

const validateOtherSections = (new_fee: CreateAndUpdateFeeBody) => {
  return true;
};

const FeeSectionDataValidator: Record<SERVICE, dataSectionValidationFunction> =
  {
    [SERVICE.FIX]: validateOtherSections,
    [SERVICE.INTERNET]: validateNewInternetFee,
    [SERVICE.CELL]: validateOtherSections,
    [SERVICE.TV]: validateOtherSections,
    [SERVICE.SUBSCRIPTION]: validateOtherSections,
  };

export const fixCalculation = async (feeId: number) => {
  const { feesFixValue, typeIds } = await getFixValuesOfFeeIndexedOnTypes(
    feeId,
  );

  const result: Record<string, number> = typeIds.reduce((acc, typeId) => {
    const fixValue = feesFixValue[typeId] || { minutes: 0, minutePrice: 0 };

    acc[`fix_${typeId}_minutes`] = Number(fixValue.minutes);
    acc[`fix_${typeId}_minutePrice`] = Number(fixValue.minutePrice);

    return acc;
  }, {} as Record<string, number>);
  return result;
};

const getFixValuesOfFeeIndexedOnTypes = async (feeId: number) => {
  const typeIds = (await GfFixCallTypes.findAll()).map((type) => type.id);

  const feesFixValue: Record<string, AnyModel> = {};
  (
    await GfFeesFixValue.findAll({ where: { feeId, fixTypeId: typeIds } })
  ).forEach((fixValue) => {
    feesFixValue[fixValue.fixTypeId] = fixValue;
  });
  return { feesFixValue, typeIds };
};

export const setFixValues = async (
  feeId: number,
  new_fix_values: Record<string, number | string | null | boolean>,
) => {
  const fix = await fixCalculation(feeId);
  const { feesFixValue, typeIds } = await getFixValuesOfFeeIndexedOnTypes(
    feeId,
  );
  const updateFixValues = [];
  const createFixValues = [];
  for (const typeId of typeIds) {
    const fixValue = feesFixValue[typeId];

    if (fixValue) {
      updateFixValues.push({
        id: fixValue.id,
        minutePrice:
          new_fix_values[`fix_${typeId}_minutePrice`] ||
          new_fix_values[`fix_${typeId}_minutePrice`] === 0
            ? new_fix_values[`fix_${typeId}_minutePrice`]
            : fix[`fix_${typeId}_minutePrice`],
        minutes:
          new_fix_values[`fix_${typeId}_minutes`] ||
          new_fix_values[`fix_${typeId}_minutes`] === 0
            ? new_fix_values[`fix_${typeId}_minutes`]
            : fix[`fix_${typeId}_minutes`],
      });
    } else {
      createFixValues.push({
        feeId: feeId,
        fixTypeId: typeId,
        minutePrice: new_fix_values[`fix_${typeId}_minutePrice`]
          ? new_fix_values[`fix_${typeId}_minutePrice`]
          : 0,
        minutes: new_fix_values[`fix_${typeId}_minutes`]
          ? new_fix_values[`fix_${typeId}_minutes`]
          : 0,
      });
    }
  }
  await GfFeesFixValue.bulkCreate(updateFixValues, {
    updateOnDuplicate: ['minutePrice', 'minutes', 'updateDate'],
  });

  await GfFeesFixValue.bulkCreate(createFixValues);
};

const findOrCreateInvoiceProduct = async (code: string) => {
  let invoiceProduct = await InvoiceProduct.findOne({
    where: { code },
  });

  let found = true;

  if (!invoiceProduct) {
    invoiceProduct = InvoiceProduct.build({
      code,
    });
    found = false;
  }

  return { invoiceProduct, found };
};

const setInvoiceProductPropertiesForSyncInvoice = async (
  invoiceProduct: AnyModel,
  gfFee: AnyModel,
  feeGroup: AnyModel,
  code: string,
) => {
  invoiceProduct.refererApp = 'goufone';
  invoiceProduct.refererKey = `fee_${gfFee.id}`;
  invoiceProduct.name = feeGroup.name;
  invoiceProduct.description = feeGroup.description;
  invoiceProduct.price = gfFee.baseQuote;
  invoiceProduct.includedTaxes = 0;
  invoiceProduct.code = code;
};

const setInvoiceProductPropertiesForInitialCost = async (
  { invoiceProduct, exist }: { invoiceProduct: AnyModel; exist: boolean },
  gfFee: AnyModel,
  feeGroup: AnyModel,
  code: string,
) => {
  invoiceProduct.name = feeGroup.name + ' (alta)';
  invoiceProduct.description = feeGroup.description;
  invoiceProduct.price = gfFee.initialCost;
  if (!exist) {
    invoiceProduct.refererApp = 'goufone';
    invoiceProduct.refererKey = 'fee_' + gfFee.id;
    invoiceProduct.refererData = '';
    invoiceProduct.includedTaxs = 0;
    invoiceProduct.code = code;
  }
};

export const syncInvoice = async function (gfFee: AnyModel) {
  const { feeGroupId, tpvCode, id } = gfFee;

  const feeGroup = await GfFeeGroup.findByPk(feeGroupId);
  assert(feeGroup, `fee group with id ${feeGroupId} not found`);

  const iva = await InvoiceTaxType.findOne({ where: { name: 'IVA' } });
  assert(iva, `iva tax with name IVA not found`);

  const code = tpvCode || `FEE/${id}`;

  const { invoiceProduct } = await findOrCreateInvoiceProduct(code);
  await setInvoiceProductPropertiesForSyncInvoice(
    invoiceProduct,
    gfFee,
    feeGroup,
    code,
  );
  await invoiceProduct.save();

  await syncMtoN(
    InvoiceProductTaxXref,
    'productId',
    invoiceProduct.id,
    'taxId',
    [iva.id],
  );

  if (invoiceProduct) {
    gfFee.tpvCode = invoiceProduct.code;
    await gfFee.save();
  }
  return {
    success: true,
  };
};

export const syncInvoiceInitialCost = async function (gfFee: AnyModel) {
  const { feeGroupId, initialCost, initialCostTpvCode, id } = gfFee;
  const feeGroup = await GfFeeGroup.findByPk(feeGroupId);
  assert(feeGroup, `fee group with id ${feeGroupId} not found`);

  const iva = await InvoiceTaxType.findOne({ where: { name: 'IVA' } });
  assert(iva, `iva with name IVA not found`);

  if (initialCost <= 0)
    return {
      success: true,
    };

  const code = initialCostTpvCode || `FEE/IC/${id}`;

  const { invoiceProduct, found } = await findOrCreateInvoiceProduct(code);
  setInvoiceProductPropertiesForInitialCost(
    { invoiceProduct, exist: found },
    gfFee,
    feeGroup,
    code,
  );
  await invoiceProduct.save();

  await syncMtoN(
    InvoiceProductTaxXref,
    'productId',
    invoiceProduct.id,
    'taxId',
    [iva.id],
  );

  if (invoiceProduct) {
    gfFee.initialCostTpvCode = invoiceProduct.code;
    await gfFee.save();
  }

  return {
    success: true,
  };
};

export const syncWithOtherEntities = async function (
  fee: GfFee,
  body: CreateAndUpdateFeeBody,
) {
  await setFixValues(fee.id, body);
  await syncInvoice(fee);
  await syncInvoiceInitialCost(fee);
  await syncInitialFees(fee, body);
};

export const syncInitialFees = async function (
  gfFee: GfFee,
  body: CreateAndUpdateFeeBody,
) {
  await FeeInitialFee.destroy({ where: { gf_fee_id: gfFee.id } });
  await FeeInitialFee.bulkCreate(
    (body.initial_fees ?? []).map((id) => {
      return {
        initial_fee_id: id,
        gf_fee_id: gfFee.id,
      };
    }),
  );
};

/**
 * Return last active fee for the given fee group id.
 */
export const getActualConditions = async function (
  feeGroupId: number | string,
  date?: string,
) {
  const query: Record<string, any> = {
    order: [['fromDate', 'DESC']],
    include: [
      {
        model: GfFeeGroup,
        as: 'feeGroup',
        required: true,
        where: {
          id: feeGroupId,
        },
      },
    ],
  };

  if (date) {
    query.where = {
      fromDate: {
        [Op.lte]: moment(date).format('YYYY-MM-DD'),
      },
    };
  }

  return GfFee.findOne(query);
};

const priceIndexedByFeeGroup: Record<string, AnyModel | null> = {};

export const getPrice = async (feeGroupId: number | string, force = false) => {
  if (!priceIndexedByFeeGroup[feeGroupId] || force) {
    const condition = await getActualConditions(feeGroupId);
    priceIndexedByFeeGroup[feeGroupId] = condition;
  }
  return priceIndexedByFeeGroup[feeGroupId];
};

export const getNameFromFeeGroupId = async function (feeGroupId: number) {
  const feeGroup = await GfFeeGroup.findByPk(feeGroupId);
  assert(feeGroup, `feeGroup with id ${feeGroupId} not found`);

  return feeGroup.internalName;
};
