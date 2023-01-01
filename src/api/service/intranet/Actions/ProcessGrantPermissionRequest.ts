import { AnyModel, intranet, system } from '@models';
import { throwIf, throwUnless } from '@api/utils/helpers';

import { GrantPermission } from '@api/models/hrms/hrms_grant_permission';
import assert from 'assert';
import { associateBy } from '@api/utils/collections';
import { createFullEvent } from '../CrmTaskHelperService';

const { GfClient, transaction } = intranet;
const { Document } = system;
/**
 * Second step, search for documentation and if done consolide change
 */
export const handle = async (grantPermissions: GrantPermission[]) => {
  const documents = await getDocuments(grantPermissions);
  const clients = await getClients(grantPermissions);

  return transaction(async () => {
    return Promise.all(
      grantPermissions.map(async (grantPermission) => {
        throwIf(
          grantPermission.done,
          `The request with ID "${grantPermission.id}" has been previously applied!`,
        );
        // check document
        const document = documents[grantPermission.docId];
        throwUnless(
          document?.signed,
          `The document has not been signed yet for request "${grantPermission.id}"!`,
        );
        const client = clients.find(({ id }) => id == grantPermission.clientId);
        assert(client);
        // everything is ok
        await applyChanges(client, grantPermission);
      }),
    );
  });
};

const getClients = async (grantPermissions: GrantPermission[]) => {
  return GfClient.findAll({
    where: {
      id: grantPermissions.map(({ clientId }) => clientId),
    },
  });
};

const getDocuments = async (grantPermissions: GrantPermission[]) => {
  const documents = await Document.findAll({
    where: {
      signed: true,
      id: grantPermissions.map(({ docId }) => docId),
    },
  });

  return associateBy(documents, ({ id }) => String(id));
};

const applyChanges = async (client: AnyModel, permission: GrantPermission) => {
  await permission.update({ isRevoked: false, done: true });
  // dispatch events
  await infoGrantPermission(client.id, permission.userId, permission);
};

export const infoGrantPermission = async (
  clientId: number,
  userId: number,
  grantPermission: GrantPermission,
) => {
  return createFullEvent(
    'infoGrantPermission',
    0,
    {
      subject: 'Grant Permission',
      clientId,
      aditionalInfo: {
        description: `${grantPermission.authorizedName} with fiscalId ${grantPermission.authorizedFiscalId} has permission.`,
      },
    },
    null,
    null,
    userId,
  );
};
