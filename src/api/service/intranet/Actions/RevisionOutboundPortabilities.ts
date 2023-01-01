import { AnyModel, intranet } from '@api/models';
import { StatusEnum, statusMapping } from '../OperadorFixFacade';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import OperadorIvozService from '../OperadorIvozService';
import { Outbound } from '@del-internet/sdk-operadors';
import { SERVICE } from '@api/constants/contracts';
import { handle as SuspendContracts } from './SuspendContracts';
import { createFullEvent } from '../CrmTaskHelperService';
import { pluck } from '@api/utils/collections';

const { GfContract, GfContractDataFix } = intranet;

const getContractsByNumbers = async (numbers: number[]) => {
  return GfContract.findAll({
    attributes: ['id', 'state'],
    include: [
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: true,
        where: { number: numbers },
        attributes: ['id', 'number'],
      },
      {
        model: GfClient,
        as: 'client',
        required: true,
        attributes: ['id', 'fiscalId'],
      },
    ],
  });
};

export const getOutboundPortabilities = async () => {
  const { data } = await OperadorIvozService.getOutboundPortabilities({
    status: statusMapping[StatusEnum.CONSOLIDATED],
  });

  return data;
};

/**
 * Process the given outbound portabilities.
 */
export const handle = async (outbounds: Outbound[] = []) => {
  const numbers = pluckNumbers(
    outbounds.length ? outbounds : await getOutboundPortabilities(),
  );
  const contracts = await getContractsByNumbers(numbers);
  // // dispatch outbound events
  await Promise.all(contracts.map(dispatchOutboundEvent));
  // // suspend contracts
  await SuspendContracts(contracts, 0);
};

const pluckNumbers = (outbounds: Outbound[]) => {
  return outbounds.flatMap((data) => pluck(data.numbers, 'start_number'));
};

export const dispatchOutboundEvent = async (contract: AnyModel) => {
  if (contract.isAvailable()) {
    await createFullEvent(
      'operdaors_outbound',
      contract.id,
      {
        subject: 'Portability Outbound',
        text: 'The contract landline has been ported out by provider [operators]',
        onetime: true,
      },
      SERVICE.FIX,
    );
  }
};
