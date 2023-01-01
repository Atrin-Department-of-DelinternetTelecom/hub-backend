import { AnyModel, intranet } from '@api/models';

import { AireTarifa } from '../AireService';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { Op } from 'sequelize';
import { Tarifa } from '@delinternet/sdk-aire';

const { GfCellProviderFee } = intranet;
const PROVIDER_ID = 1;

/**
 * Import AIRE tarifa data.
 * Following code sync the AIRE service taifa (FEE) by the local fees.
 */
export const handle = async (): Promise<void> => {
  const tarifas = await AireTarifa.findAll();
  // Remove old cell fees
  await removeOldCellFees(tarifas);
  const exists = await getExistingCellFees();
  const existsProviderFeeId = exists.map(({ providerFeeId }) => providerFeeId);
  // Insert new items
  await insertNewCellFees(tarifas, existsProviderFeeId);
  // Update existing items
  await updateExistingCellFees(tarifas, exists);
};

const removeOldCellFees = async (tarifas: Tarifa[]): Promise<void> => {
  const oldProviderFeeIds = tarifas.map(({ siglas }) => siglas);

  const toDisableOldProviderFeeIds = (
    await GfCellProviderFee.findAll({
      where: {
        providerId: PROVIDER_ID,
        providerFeeId: {
          [Op.notIn]: oldProviderFeeIds,
        },
      },
    })
  ).map((cellFee) => cellFee.providerFeeId);

  await GfCellProviderFee.update(
    { status: 0 },
    {
      where: {
        providerId: PROVIDER_ID,
        providerFeeId: {
          [Op.in]: toDisableOldProviderFeeIds,
        },
      },
    },
  );

  const deactiveFeeGroups = (
    await GfFee.findAll({
      where: { tpvCode: { [Op.in]: toDisableOldProviderFeeIds } },
    })
  ).map((gfFee) => gfFee.feeGroupId);

  await GfFeeGroup.update(
    { active: 0 },
    {
      where: {
        id: {
          [Op.in]: deactiveFeeGroups,
        },
      },
    },
  );

  console.log(`[${new Date()}] following aire tarifas removed:`);
  console.log(JSON.stringify(oldProviderFeeIds));
};

const getExistingCellFees = async (): Promise<AnyModel[]> => {
  return GfCellProviderFee.findAll({
    where: { providerId: PROVIDER_ID },
  });
};

const insertNewCellFees = async (
  tarifas: Tarifa[],
  existsProviderFeeId: string[],
): Promise<void> => {
  const newCellFees = tarifas
    .filter(({ siglas }) => !existsProviderFeeId.includes(siglas))
    .map(({ estado, siglas, nombre_tarifa, importe_tarifa }: Tarifa) => {
      return {
        providerState: estado === 'ON' ? 1 : 0,
        providerId: PROVIDER_ID,
        tpvCode: siglas,
        providerFeeId: siglas,
        providerName: nombre_tarifa,
        providerBaseQuote: importe_tarifa,
      };
    });
  await GfCellProviderFee.bulkCreate(newCellFees);

  console.log(`[${new Date()}] following aire tarifas inserted:`);
  console.log(JSON.stringify(newCellFees));
};

const updateExistingCellFees = async (
  tarifas: Tarifa[],
  exists: AnyModel[],
): Promise<void> => {
  await Promise.all(
    exists.map((cellFee) => {
      const tarifa = tarifas.find(
        ({ siglas }) => cellFee.providerFeeId === siglas,
      );
      cellFee.fillFromTarifa(
        tarifa?.estado === 'ON',
        tarifa?.nombre_tarifa,
        tarifa?.importe_tarifa,
      );
      return cellFee.save();
    }),
  );

  console.log(`[${new Date()}] following aire tarifas updated:`);
  console.log(JSON.stringify(tarifas.map(({ siglas }) => siglas)));
};
