import { AnyModel, intranet } from '@models';
import {
  createCatch,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';

import { GfActiveFee } from '@api/models/intranet/intranet_active_fee';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { handle as ImportAireBonuses } from './Actions/ImportAireBonuses';
import { handle as ImportAireTarifas } from './Actions/ImportAireTarifas';
import { handle as ImportLemonTarifas } from './Actions/ImportLemonTarifas';
import { handle as SyncProviderFees } from './Actions/SyncProviderFees';
import { lemon } from '@lib/lemon';
import { respondSuccess } from '@utils/response';

const { InvoiceProduct } = intranet;

export const syncFeesToLocal = async () => {
  await SyncProviderFees();

  return respondSuccess({ message: 'Data inserted successfully!' });
};

export const importFees = async (loadAllLemonPackages = false) => {
  await ImportAireTarifas();
  await ImportLemonTarifas(loadAllLemonPackages);
  return respondSuccess({ message: 'Data inserted successfully!' });
};

export const importAllBonus = async () => {
  await ImportAireBonuses();

  return respondSuccess({ message: 'Data inserted successfully!' });
};

export const createGfCellProviderFee = async (body: Record<string, any>) => {
  return createCatch(body, GfCellProviderFee);
};

export const getGfCellProviderFee = async function (
  query: Record<string, any>,
) {
  return getAllEntities(query, GfCellProviderFee, undefined, [
    {
      model: InvoiceProduct,
      as: 'invoice_product',
      required: false,
    },
    {
      model: GfActiveFee,
      attributes: ['id', 'name', 'feeGroupId'],
      required: false,
    },
  ]);
};

export const getGfCellProviderFeeId = async function (id: number) {
  return findAndGet(id, GfCellProviderFee, [
    {
      model: InvoiceProduct,
      as: 'invoice_product',
      required: false,
    },
    {
      model: GfActiveFee,
      attributes: ['id', 'name', 'feeGroupId'],
      required: false,
    },
  ]);
};

export const updateGfCellProviderFee = async function (
  id: number,
  body: Record<string, any>,
) {
  return findAndUpdate(id, body, GfCellProviderFee);
};

export const deleteGfCellProviderFee = async function (id: number) {
  return findAndDeleteIntranet(id, GfCellProviderFee);
};

export const initLemonTarifas = async function () {
  await ImportLemonTarifas(true);
  return respondSuccess('Data inserted successfully!');
};

export const modifyLemonTarifas = async function () {
  const lemonFees = (await lemon.fee.getProducto('0')).data;

  const gfLemonFees = (
    await GfFee.findAll({ where: { cellProviderId: 2 } })
  ).reduce((acc, gfLemonFee) => {
    const { tpvCode } = gfLemonFee;
    if (!acc[tpvCode]) {
      acc[tpvCode] = [];
    }
    acc[tpvCode].push(gfLemonFee);
    return acc;
  }, {} as Record<string, AnyModel[]>);

  const updatePromises = lemonFees
    .filter(
      (lemonFee) =>
        lemonFee.packageId && Array.isArray(gfLemonFees[lemonFee.packageId]),
    )
    .flatMap((lemonFee) => {
      const selectedLemonFees = gfLemonFees[lemonFee.packageId];
      return selectedLemonFees.map((selectedLemonFee) => {
        selectedLemonFee.extraData = JSON.stringify(lemonFee);
        return selectedLemonFee.save();
      });
    });

  await Promise.all(updatePromises);

  return respondSuccess('Data modified successfully!');
};
