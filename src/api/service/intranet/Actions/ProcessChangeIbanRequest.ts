import { AnyModel, intranet, system } from '@models';
import { throwIf, throwUnless } from '@api/utils/helpers';

import { ChangeBankNumber } from '@api/models/global/global_change_bank_number';
import { associateBy } from '@api/utils/collections';
import { createFullEvent } from '../CrmTaskHelperService';
import * as ClientSepa from '../GfClientSepa';
import { User } from '@api/models/global/global_users';

const { GfClient, transaction } = intranet;
const { Document } = system;
/**
 * Second step, search for documentation and if done consolide change
 */
export const handle = async (changeBankNumbers: ChangeBankNumber[]) => {
  const associatedChanges = associateChangesByClientId(changeBankNumbers);
  const clients = await getClients(Object.keys(associatedChanges));
  const documents = await getDocuments(changeBankNumbers);

  return transaction(async () => {
    return Promise.all(
      clients
        .filter(({ id }) => associatedChanges[id] !== undefined)
        .map(async (client) => {
          // check bank data
          const bankData = associatedChanges[client.id];
          throwIf(
            bankData.done,
            `The request with ID "${bankData.id}" has been previously applied!`,
          );
          // check document
          const document = documents[bankData.doc_id];
          throwUnless(
            document?.signed,
            `The document has not been signed yet for request "${bankData.id}"!`,
          );
          // everything is ok
          await applyChanges(client, bankData);
        }),
    );
  });
};

const associateChangesByClientId = (changeBankNumbers: ChangeBankNumber[]) => {
  return associateBy(changeBankNumbers, ({ gf_client_id }) => {
    return gf_client_id as unknown as string;
  });
};

const getClients = async (clients: number[] | string[]) => {
  return GfClient.findAll({ where: { id: clients } });
};

const getDocuments = async (changeBankNumbers: ChangeBankNumber[]) => {
  const documents = await Document.findAll({
    where: {
      signed: true,
      id: changeBankNumbers.map(({ doc_id }) => doc_id),
    },
  });

  return associateBy(documents, ({ id }) => String(id));
};

const applyChanges = async (client: AnyModel, bankData: ChangeBankNumber) => {
  const oldIban = client.get({ plain: true })?.iban ?? '';
  await client.update({
    iban: bankData.iban,
    bic: bankData.bic,
    bicName: bankData.bank,
  });

  await bankData.update({ done: true });

  const moozaic_user_id = bankData.user_id;
  const user = await User.findOne({
    where: {
      userId: moozaic_user_id,
    },
  });

  await ClientSepa.createIfNeeded(client.id, user?.id ?? 1);

  // dispatch events
  await infoChangeIban(client.id, bankData.user_id, bankData, oldIban);
};

export const infoChangeIban = async (
  clientId: number,
  userId: number,
  bankData: ChangeBankNumber,
  oldIban: string,
) => {
  return createFullEvent(
    'infoChangeIban',
    0,
    {
      subject: 'Client IBAN changed',
      clientId,
      aditionalInfo: {
        description: `IBAN changed from ${oldIban} to ${bankData.iban}.`,
      },
    },
    null,
    null,
    userId,
  );
};
