import { ChangeBankNumber } from '@api/models/global/global_change_bank_number';
import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';
import { TYPE } from '@api/constants/documents';
import { system } from '@models';
import { throwIf } from '@api/utils/helpers';
import { validateIban } from '../IbanService';

const { transaction } = system;

export interface ChangeHolderParams {
  clientId: number;
  userId: number;
  iban: string;
  bic?: string | null;
  bank?: string | null;
}

/**
 * Process a contract for changing the holder.
 */
export const handle = async ({
  clientId,
  userId,
  iban,
  bic = null,
  bank = null,
}: ChangeHolderParams): Promise<ChangeBankNumber> => {
  // validate the iban
  await validateIban(iban);
  // check old proccess
  await checkInProgressChangeIban(clientId);

  return transaction(async () => {
    const { id: doc_id } = await DelinternetStorage.create(TYPE.CHANGE_IBAN, 1);

    return ChangeBankNumber.create({
      gf_client_id: clientId,
      user_id: userId,
      doc_id,
      done: false,
      iban,
      bic,
      bank: bank,
    });
  });
};

const checkInProgressChangeIban = async (clientId: number) => {
  const pendingChange = await ChangeBankNumber.findOne({
    where: {
      gf_client_id: clientId,
      done: false,
    },
  });

  throwIf(
    pendingChange !== null,
    'There is already a change IBAN request in progress.',
  );
};
