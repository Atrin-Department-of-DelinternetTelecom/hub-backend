import { AnyModel, intranet } from '@api/models';
import { Op, WhereOptions } from 'sequelize';
import RadiusApiService, { PaginationItem } from '../RadiusApiService';
import { associateBy, unique } from '@api/utils/collections';

import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { RADIUS_STATE } from '@api/constants/statuses';
import { RadiusDifference } from '@api/models/global/global_radius_difference';
import assert from 'assert';
import { chunk } from 'lodash';
import { get as config } from '@config';
import moment from 'moment';

const { GfContract } = intranet;

type Difference = {
  gf_contract_id: number | null;
  username: string;
  is_active: boolean;
  is_configured: boolean;
  has_valid_state: boolean;
};

/**
 * Link the given array of AIRE contracts with the intranet contracts.
 */
export const handle = async (usernames: string[] = [], perPage = 150) => {
  // reset lookups
  await clearLogs(usernames);
  // lookup changes
  await storeIssues(
    usernames.length > 0
      ? await getPartialDifferences(usernames)
      : await getTotalDifferences(perPage),
  );
};

const clearLogs = async (usernames: string[] = []) => {
  if (usernames.length > 0) {
    await RadiusDifference.destroy({ where: { username: usernames } });
  } else {
    await RadiusDifference.destroy({ truncate: true });
  }
};

const getPartialDifferences = async (
  usernames: string[],
): Promise<Difference[]> => {
  const internets = await getInternets(usernames);
  const diffrences: Difference[] = [];

  for (const username in internets) {
    const response = await RadiusApiService.getUserData(username);
    assert(response.success, `Radius info not found for ${username}`);
    // check diffrences
    const difference = differenceData(
      {
        username,
        password: response.data.data.general.password,
        groupname: response.data.data.general.groupname,
        static_ip: null,
        ipv6_prefix: null,
        RadiusServer: null,
        First_connection: null,
        Last_up: null,
        Last_down: null,
        Active_connections: 1,
        ClientSRC: null,
        ClientWAN: null,
        AcctSessionID: null,
        speed_up: null,
        speed_down: null,
        type: null,
      },
      internets[username],
    );
    if (difference) diffrences.push(difference);
  }

  return diffrences;
};

const getTotalDifferences = async (perPage = 150): Promise<Difference[]> => {
  const internets = await getInternets();
  const diffrences: Difference[] = [];
  const syncedUsernames: string[] = [];
  let page = 1;
  let hasMorePage = false;

  do {
    const paginate = await RadiusApiService.paginate(perPage, page);

    for (const radiusInfo of paginate.data.data.items) {
      syncedUsernames.push(radiusInfo.username);
      // check diffrences
      const difference = differenceData(
        radiusInfo,
        internets[radiusInfo.username],
      );
      if (difference) diffrences.push(difference);
    }

    hasMorePage = paginate.data.data.total - syncedUsernames.length > 0;
    page++;
  } while (hasMorePage);

  return [...diffrences.flat(), ...getMissings(internets, syncedUsernames)];
};

const getInternets = async (usernames: string[] = []) => {
  const where: WhereOptions = {};

  if (usernames.length > 0) {
    where.nodeRadiusName = usernames;
  }

  return associateBy(
    await GfContractDataInternet.findAll({
      where,
      attributes: ['id', 'nodeRadiusName', 'contractId'],
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          attributes: ['id', 'state'],
        },
      ],
    }),
    ({ nodeRadiusName }) => nodeRadiusName!,
  );
};

const differenceData = (
  radiusInfo: PaginationItem,
  internet: GfContractDataInternet,
): Difference | undefined => {
  if (internet === undefined) {
    // missing intranet contract
    return baseDifferenceData(radiusInfo);
  }
  assert(internet.contract, 'Invalid contract');

  if (
    !internet.contract.hasValidState(radiusInfo.groupname) &&
    instalationDatePassed(internet.instalationDate)
  ) {
    // mismatch state
    return {
      ...baseDifferenceData(radiusInfo),
      gf_contract_id: internet.contract.id,
      is_configured: true,
      has_valid_state: false,
    };
  }
};

const getMissings = (
  internets: Record<string, AnyModel>,
  usernames: string[],
) => {
  return Object.keys(internets)
    .filter((nodeRadiusName) => {
      const contract = internets[nodeRadiusName].contract;

      return !usernames.includes(nodeRadiusName) && contract.isActive();
    })
    .map((nodeRadiusName) => {
      return {
        username: nodeRadiusName,
        is_active: false,
        gf_contract_id: internets[nodeRadiusName].contractId,
        is_configured: false,
        has_valid_state: false,
      };
    });
};

const baseDifferenceData = (radiusInfo: PaginationItem): Difference => {
  return {
    username: radiusInfo.username,
    is_active: radiusInfo.groupname !== RADIUS_STATE.BLOCKED,
    is_configured: false,
    has_valid_state: false,
    gf_contract_id: null,
  };
};

const instalationDatePassed = (instalationDate?: Date | string | null) => {
  if (!instalationDate) {
    return false;
  }

  return moment(instalationDate).isAfter(
    moment().subtract(
      config('index.tasks.refreshRadiusLookups.effectiveDay', 4),
      'day',
    ),
  );
};

const storeIssues = async (issues: Array<Difference>) => {
  for (const rows of chunk(unique(issues, 'username'), 200)) {
    await RadiusDifference.bulkCreate(rows);
  }
};
