import { ActionEvent } from '@api/models/crud/crud_action_event';
import { FacadeInternet } from '../Facades';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import RadiusApiService from '../../RadiusApiService';
import { SERVICE } from '@api/constants/contracts';
import { User } from '@api/models/global/global_users';
import assert from 'assert';
import { execute } from '../../GfContractSectionStatusService';
import { getSectionIdByCode } from '../../GfSectionService';
import { intranet } from '@api/models';

const { GfContract } = intranet;

const findDataInternetOrFail = async (contractId: number) => {
  const dataInternet = await GfContractDataInternet.findOne({
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        where: { id: contractId },
      },
    ],
  });

  assert(dataInternet);

  return dataInternet;
};

export const configureRadius = async (contractId: number, user: User) => {
  // Ensure radius is configured
  RadiusApiService.getInstance().ensureIsConfigured();
  // Get current internet to track changes
  const original = await findDataInternetOrFail(contractId);
  // Try to configure
  await FacadeInternet.doRadius(contractId);
  // Try to activate contract
  const sectionId = await getSectionIdByCode(SERVICE.INTERNET);
  await execute(contractId, sectionId, user.userId);
  // Save history of changes
  const dataInternet = await findDataInternetOrFail(contractId);
  await ActionEvent.forResourceUpdate({
    original,
    resource: dataInternet,
    userId: user.id,
  }).markAsFinished();
};

export default configureRadius;
