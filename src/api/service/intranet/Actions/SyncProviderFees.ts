import { AnyModel, intranet } from '@api/models';
import {
  setFixValues,
  syncInvoice,
  syncInvoiceInitialCost,
} from '../Fee/GfFeeService';

import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import assert from 'assert';
import { getSectionIdByCode } from '../GfSectionService';
import { pluck } from '@api/utils/collections';

const { GfFeegroupsSectionsXref } = intranet;

/**
 * Import AIRE tarifa data.
 */
export const handle = async (
  packages: GfCellProviderFee[] = [],
): Promise<void> => {
  const providerRates =
    packages.length > 0 ? packages : await getProviderRates();
  const syncedRates = await getSyncedRates(providerRates);
  console.log(`Found [${providerRates.length}] AIRE rate to sync.`);
  // sync rates
  await syncRates(providerRates, syncedRates);
  console.log(`Syncing [${providerRates.length}] AIRE rate finished.`);
};

const syncRates = async (
  providerRates: GfCellProviderFee[],
  syncedRates: GfFee[],
) => {
  await Promise.all(
    providerRates.map((aireFee) => updateOrCreateFee(aireFee, syncedRates)),
  );
};

const updateOrCreateFee = async (
  aireFee: GfCellProviderFee,
  syncedRates: GfFee[],
) => {
  const localFees = syncedRates.filter(({ cellFee }) => cellFee == aireFee.id);

  if (localFees.length == 0) {
    await createLocalFee(aireFee);
  } else {
    const autoUpdates = localFees.filter(({ autoUpdate }) => autoUpdate);

    await updateLocalFees(autoUpdates, aireFee);
  }
};

const updateLocalFees = async (
  autoUpdates: GfFee[],
  aireFee: GfCellProviderFee,
) => {
  await Promise.all(
    autoUpdates.map((localFee) => updateLocalFee(aireFee, localFee)),
  );
};

const updateLocalFee = async (aireFee: GfCellProviderFee, localFee: GfFee) => {
  await aireFee.ensureOfTpvCode();

  if (localFee.isCompatibleWithAire(aireFee)) {
    console.warn(
      `[SyncProviderFees][${aireFee.providerFeeId}] updating fee with id[${localFee.id}] from AIRE [${aireFee.tpvCode}] ignored because missing updates!`,
    );
  } else {
    console.log(
      `[SyncProviderFees][${aireFee.providerFeeId}] updating fee with id[${localFee.id}] from AIRE [${aireFee.tpvCode}]!`,
    );
    await localFee.update({
      baseQuote: localFee.getBaseQuote(aireFee),
      name: aireFee.providerName,
      tpvCode: aireFee.tpvCode,
    });

    // build InvoiceProduct
    await syncInvoiceProfile(localFee, localFee.get({ plain: true }));
  }

  if (localFee.feeGroup) {
    await updateFeeGroup(aireFee, localFee.feeGroup.id);
  }
};

const updateFeeGroup = async (
  aireFee: GfCellProviderFee,
  feeGroupId: number,
) => {
  const feeGroup = await GfFeeGroup.findByPk(feeGroupId);

  assert(
    feeGroup,
    `[SyncProviderFees][updateFeeGroup] Fee group with id ${feeGroupId} not found!`,
  );
  // activate fee group
  if (aireFee.isActive() && !feeGroup.isActive()) {
    await feeGroup.activate();
  }
  // deactivate fee group
  if (!aireFee.isActive() && feeGroup.isActive()) {
    await feeGroup.deactivate();
  }
};

const createLocalFee = async (
  aireFee: GfCellProviderFee,
): Promise<AnyModel> => {
  console.log(
    `[SyncProviderFees][${aireFee.providerFeeId}] creating fee from AIRE`,
  );
  const [feeGroup, sectionId] = await Promise.all([
    createFeeGroup(aireFee),
    getSectionIdByCode('CELL'),
  ]);

  await Promise.all([
    GfFeegroupsSectionsXref.create({ feeGroupId: feeGroup.id, sectionId }),
    aireFee.ensureOfTpvCode(),
  ]);

  const localFee = await GfFee.create({
    name: aireFee.providerName + ' [IMPORTED]',
    fromDate: '2000-01-01',
    feeGroupId: feeGroup.id,
    cellFee: aireFee.id,
    cellPercentage: 0,
    baseQuote: aireFee.providerBaseQuote,
    providerFeeId: aireFee.providerId,
    cellProviderId: aireFee.providerId,
    tpvCode: aireFee.tpvCode,
  });

  await syncInvoiceProfile(localFee, localFee.get({ plain: true }));

  return localFee;
};

const createFeeGroup = (aireFee: GfCellProviderFee) => {
  return GfFeeGroup.create({
    active: aireFee.providerState,
    name: aireFee.providerName,
    internalName: aireFee.providerName,
    description: aireFee.providerName,
  });
};

const syncInvoiceProfile = async (
  fee: AnyModel,
  newFeeData: Record<string, any>,
) => {
  await setFixValues(fee.id, newFeeData);
  await syncInvoice(fee);
  await syncInvoiceInitialCost(fee);
};

const getProviderRates = () => GfCellProviderFee.findAll();

const getSyncedRates = (providerRates: GfCellProviderFee[]) => {
  return GfFee.findAll({
    where: { cellFee: pluck(providerRates, 'id') },
    include: [{ model: GfFeeGroup, as: 'feeGroup' }],
    order: [['id', 'DESC']],
  });
};
