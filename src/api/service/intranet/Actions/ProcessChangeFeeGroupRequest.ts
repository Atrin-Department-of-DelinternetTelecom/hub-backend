import { AnyModel, intranet } from '@models';
import { CELL_PROVIDER_CODE, SERVICE } from '@api/constants/contracts';
import {
  findForContract,
  forget,
  setupCache,
} from './Caches/GfContractSectionStatusCaches';

import { Aire } from '@lib/sdk';
import { FacadeInternet } from '../Contract/Facades';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import assert from 'assert';
import { getProviderConditions } from '../Contract/helpers';
import { lemon } from '@lib/lemon';
import moment from 'moment';
import { onFeeChanged } from '../GfDiscountsExecuteService';
import { removeChangeConditionsEvent } from '../GfCrmContractService';
import { sync } from '../SuggestDiscountService';
import to from 'await-to-js';
import { updateAllFromClient } from '../GfDiscountsPendingService';

const { GfContract, transaction } = intranet;

/**
 * Second step, search for documentation and if done consolide change
 */
export const handle = async (
  changeFeeGroup: AnyModel,
  userId: number,
  executedDate = moment(),
) => {
  await setupCache([changeFeeGroup.contractId]);

  await transaction(async () => {
    // finish the proccess
    await changeFeeGroup.update({
      done: 1,
      executedDate: executedDate.format('YYYY-MM-DD HH:mm:ss'),
    });
    // change contract fee-group
    const contract = await GfContract.findByPk(changeFeeGroup.contractId);
    assert(contract);
    await contract.update({ feeGroupId: changeFeeGroup.toFeeGroupId });

    const { type } = (await findForContract(contract.id)) ?? {};
    assert(type);

    if (type === SERVICE.INTERNET) {
      await changeInternet(contract);
    } else if (type === SERVICE.CELL) {
      await changeTarifa(contract, changeFeeGroup.toFeeGroupId);
    }

    const [executeError] = await to(
      onFeeChanged(
        changeFeeGroup.id,
        moment().format('YYYY-MM-DD HH:mm:ss'),
        userId,
      ),
    );

    console.error(
      'Error on GfDiscountsExecuteService.onFeeChanged',
      executeError,
    );

    const [pendingError] = await to(
      updateAllFromClient(
        contract.clientId,
        undefined,
        undefined,
        true,
        userId,
      ),
    );
    await sync(contract.id);

    console.error(
      'Error on GfDiscountsPendingService.updateAllFromClient',
      pendingError,
    );

    await removeChangeConditionsEvent(changeFeeGroup.id, true);
  });
  await forget();
};

const changeInternet = async (contract: AnyModel) => {
  await FacadeInternet.doRadius(contract.id);
};

const changeTarifa = async (contract: AnyModel, toFeeGroupId: number) => {
  const dataCell = await GfContractDataCell.findOne({
    where: { contractId: contract.id },
  });
  assert(
    dataCell?.number,
    `Invalid contract on change fee [CID#${contract.id}]`,
  );

  const { cellFee, provider } = await getProviderConditions(toFeeGroupId);

  if (provider.code === CELL_PROVIDER_CODE.AIRE) {
    return Aire.setTarifa({
      telefono: dataCell.number,
      tarifa: cellFee.providerFeeId,
    });
  }

  if (provider.code === CELL_PROVIDER_CODE.LEMON) {
    return lemon.fee.changeTarifa({
      msisdn: dataCell.number,
      tarifa: cellFee.providerFeeId,
    });
  }
};
