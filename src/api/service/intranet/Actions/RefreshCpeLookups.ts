import { associateBy, unique } from '@api/utils/collections';
import { chunk, omit } from 'lodash';

import { ACS } from '@lib/sdk';
import { CONTRACT } from '@api/constants/statuses';
import { CpeDifference } from '@api/models/global/global_cpe_difference';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { Op } from 'sequelize';
import { intranet } from '@api/models';

const { GfContract, GfSection } = intranet;

export interface Device {
  cpeDeviceId: string;
  cpeSn: string;
  cpeModel: string;
  cpePppoeUsername: string;
  cpePppoePassword: string;
  cpeWifiSsid: string;
  cpeWifiPassword: string;
}

export type Difference = {
  serial_number: string | null;
  device_id: string | null;
  gf_contract_id: number | null;
  is_configured: boolean;
  need_factory_reset: boolean;
  has_credential_error: boolean;
};

/**
 * Look up ACS differences by local contracts for given serial numbers.
 */
export const handle = async (serialNumbers: string[] = []) => {
  // reset lookups
  await clearLogs(serialNumbers);
  // lookup changes
  const devices: Record<string, Device> = associateBy(
    (await ACS.devices.all()).map((device) => device.cpeInfo()),
    (device) => device.cpeSn,
  );
  const internets = await getInternets(serialNumbers);
  const differences: Difference[] = [];
  const changes = [];

  for (const internet of internets) {
    const device = devices[internet.cpeSn as string];
    // find differences
    const difference = differenceData(internet, device);
    if (difference) differences.push(difference);
    // sync local
    if (
      device !== undefined &&
      internet.cpeDeviceId !== device.cpeDeviceId &&
      internet.cpeModel !== device.cpeModel
    ) {
      changes.push({
        id: internet.id,
        cpeDeviceId: device.cpeDeviceId,
        cpeModel: device.cpeModel,
      });
    }
  }

  // update change
  await GfContractDataInternet.bulkCreate(changes, {
    updateOnDuplicate: ['cpeDeviceId', 'cpeModel'],
  });
  // update issues table
  storeIssues(
    serialNumbers.length
      ? differences
      : [...differences, ...getExtraConfigurations(devices, internets)],
  );
};

const clearLogs = async (serialNumbers: string[] = []) => {
  if (serialNumbers.length > 0) {
    await CpeDifference.destroy({ where: { serial_number: serialNumbers } });
  } else {
    await CpeDifference.destroy({ truncate: true });
  }
};

const getInternets = async (serialNumbers: string[]) => {
  const internets = await GfContractDataInternet.findAll({
    where: serialNumbers.length > 0 ? { cpeSn: serialNumbers } : {},
    attributes: [
      'id',
      'cpeWifiSsid',
      'cpeWifiPassword',
      'cpeDeviceId',
      'cpeSn',
      'contractId',
      'cpePppoeUsername',
      'cpePppoePassword',
      'nodeRadiusName',
      'nodeRadiusPassword',
    ],
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        attributes: ['state', 'id', 'feeGroupId'],
        where: { state: { [Op.not]: [CONTRACT.SUSPENDED] } },
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            required: false,
            include: [
              {
                model: GfSection,
                as: 'sections',
                required: false,
              },
              {
                model: GfFee,
                as: 'gf_fees',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  return internets.filter(({ contract }) => contract!.useCpe);
};

const differenceData = (
  internet: GfContractDataInternet,
  device?: Device,
): Difference | undefined => {
  const need_factory_reset = haveToReset(internet, device);
  const is_configured = device !== undefined;

  if (!device || need_factory_reset) {
    return {
      serial_number: device?.cpeSn ?? null,
      device_id: device?.cpeDeviceId ?? null,
      gf_contract_id: internet.contractId,
      has_credential_error: false,
      is_configured,
      need_factory_reset,
    };
  }
};

const haveToReset = (internet: GfContractDataInternet, device?: Device) => {
  if (
    !device ||
    internet.contract?.isActive() ||
    (device.cpePppoePassword === null && device.cpePppoeUsername === null)
  ) {
    return false;
  }

  return (
    internet.nodeRadiusName !== device.cpePppoeUsername ||
    internet.nodeRadiusPassword !== device.cpePppoePassword
  );
};

const getExtraConfigurations = (
  devices: Record<string, Device>,
  internets: GfContractDataInternet[],
): Difference[] => {
  const extraConfigurations: Device[] = Object.values(
    omit(
      devices,
      internets.filter(({ cpeSn }) => cpeSn).map(({ cpeSn }) => cpeSn!),
    ),
  );

  return extraConfigurations.map(({ cpeSn, cpeDeviceId }): Difference => {
    return {
      serial_number: cpeSn,
      device_id: cpeDeviceId,
      need_factory_reset: true,
      has_credential_error: false,
      gf_contract_id: null,
      is_configured: false,
    };
  });
};

const storeIssues = async (issues: Array<Difference>) => {
  for (const rows of chunk(unique(issues, 'serial_number'), 200)) {
    await CpeDifference.bulkCreate(rows);
  }
};
