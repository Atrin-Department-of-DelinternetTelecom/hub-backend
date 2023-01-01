import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { Sequelize } from 'sequelize';
import { Static } from '@lib/cache';

export const forget = () => {
  Static.forget('CellActualFeeGroup:cachedActualFeeGroups');
};
export const setupCache = async () => {
  forget();
  await cachedActualFeeGroups();
};

export const findForKey = async (
  siglas: string,
): Promise<number | undefined> => {
  return (await cachedActualFeeGroups())[siglas];
};

const cachedActualFeeGroups = async () => {
  return Static.sear(
    'CellActualFeeGroup:cachedActualFeeGroups',
    async () => {
      const actualFeeGroups: Record<string, number> = {};
      // prepare actual fee groups
      (await getActualFeeGroups()).forEach(({ id, gf_fees }) => {
        (gf_fees as GfFee[]).forEach(
          ({ cellProviderFees, feeGroupId }: GfFee) => {
            actualFeeGroups[cellProviderFees!.providerFeeId] = feeGroupId;
          },
        );
      });

      return actualFeeGroups;
    },
    1200,
  );
};

const getActualFeeGroups = async (): Promise<GfFeeGroup[]> => {
  return GfFeeGroup.findAll({
    attributes: [
      'id',
      // add other columns here...
      [Sequelize.col('gf_fees.fromDate'), 'fromDate'],
    ],
    include: [
      {
        model: GfFee,
        as: 'gf_fees',
        attributes: ['id', 'feeGroupId'],
        include: [
          {
            model: GfCellProviderFee,
            as: 'cellProviderFees',
            attributes: ['id', 'providerFeeId'],
          },
        ],
      },
    ],
    order: [
      [Sequelize.col('gf_fees.fromDate'), 'DESC'],
      ['active', 'DESC'],
    ],
  });
};
