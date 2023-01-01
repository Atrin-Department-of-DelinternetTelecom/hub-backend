import { AnyModel, intranet } from '@api/models';
import { associateBy, unique } from '@api/utils/collections';

import { IvozDifference } from '@api/models/global/global_ivoz_difference';
import { Op } from 'sequelize';
import OperadorIvozService from '../OperadorIvozService';
import { chunk } from 'lodash';
import moment from 'moment';

const { GfContract, GfContractDataFix } = intranet;

type Difference = {
  gf_contract_id: number | null;
  extension: string;
  is_active: boolean;
  is_configured: boolean;
  has_valid_state: boolean;
};

export type RegisteredEndpointStatus = {
  contact: string;
  expires: string;
  userAgent: string;
};

export type RegisteredEndpoint = {
  ddi: string;
  domainName: string;
  status: RegisteredEndpointStatus[];
};

/**
 * Link the given array of AIRE contracts with the intranet contracts.
 */
export const handle = async (extensions: string[] = []) => {
  // reset lookups
  await clearLogs(extensions);
  const registeredEndpoints = associateBy(
    await getRegisteredEndpoints(extensions),
    ({ ddi }) => ddi,
  );
  const dataFixes = await getFixContracts(extensions);
  const differences: Difference[] = [];
  // lookup contracts
  for (const dataFix of dataFixes) {
    const registeredEndpoint = registeredEndpoints[dataFix.number];
    if (registeredEndpoint === undefined) {
      differences.push(missingIvoz(dataFix));
    } else if (
      isActiveEndpoint(registeredEndpoint) !== dataFix.contract.isActive()
    ) {
      differences.push(wrongState(dataFix, registeredEndpoint));
    }
    // to remove from missing differences
    delete registeredEndpoints[dataFix.number];
  }
  // lookup changes
  await storeIssues([
    ...differences,
    ...getMissingDifferences(Object.values(registeredEndpoints)),
  ]);
};

const clearLogs = async (extensions: string[] = []) => {
  if (extensions.length > 0) {
    await IvozDifference.destroy({ where: { extension: extensions } });
  } else {
    await IvozDifference.destroy({ truncate: true });
  }
};

const getRegisteredEndpoints = async (
  extensions: string[],
): Promise<RegisteredEndpoint[]> => {
  const response = await OperadorIvozService.getRegisteredEndpoints();

  if (response?.success === false) {
    throw new Error(response.debug?.response_original ?? response.reason);
  }

  const registeredEndpoints = response.data as unknown as RegisteredEndpoint[];

  return extensions.length === 0
    ? registeredEndpoints
    : registeredEndpoints.filter(({ ddi }) => extensions.includes(ddi));
};

const missingIvoz = (dataFix: AnyModel) => {
  return {
    gf_contract_id: dataFix.contractId,
    extension: dataFix.number,
    is_active: false,
    is_configured: false,
    has_valid_state: !dataFix.contract.isAvailable(),
  };
};

const wrongState = (
  dataFix: AnyModel,
  registeredEndpoint: RegisteredEndpoint,
) => {
  const isActive = isActiveEndpoint(registeredEndpoint);

  return {
    ...missingIvoz(dataFix),
    is_active: isActive, // should check ivoz state
    is_configured: true,
    has_valid_state: dataFix.contract.isActive() === isActive, // should check ivoz state
  };
};

const isActiveEndpoint = (endpoint: RegisteredEndpoint) => {
  const activeStatus = endpoint.status.find(({ expires }) => {
    return moment(expires).isSameOrAfter(moment());
  });

  return activeStatus !== undefined;
};

const getFixContracts = async (extensions: string[] = []) => {
  return GfContractDataFix.findAll({
    where: {
      number:
        extensions.length > 0
          ? extensions
          : { [Op.and]: [{ [Op.not]: null }, { [Op.not]: '' }] },
    },
    attributes: ['id', 'number', 'contractId'],
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        attributes: ['id', 'state'],
      },
    ],
  });
};

const getMissingDifferences = (missing: RegisteredEndpoint[]) => {
  return missing.map((endpoint) => {
    const isActive = isActiveEndpoint(endpoint);

    return {
      gf_contract_id: null,
      extension: endpoint.ddi,
      is_active: isActive, // should check ivoz state
      is_configured: false,
      has_valid_state: !isActive, // should check ivoz state
    };
  });
};

const storeIssues = async (issues: Array<Difference>) => {
  for (const rows of chunk(unique(issues, 'extension'), 200)) {
    await IvozDifference.bulkCreate(rows);
  }
};
