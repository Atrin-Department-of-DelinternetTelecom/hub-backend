import { AnyModel, system } from '@models';

import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';
import { TYPE } from '@api/constants/documents';
import { throwIf } from '@api/utils/helpers';

const { GrantPermission, GrantPermissionAssociation, transaction } = system;

export interface Assignment {
  name: string;
  fiscalId: string;
  description: string;
  userId: number;
  permissions: number[];
}

/**
 * Process a contract for changing the holder.
 */
export const handle = async (
  clients: AnyModel[],
  { name, fiscalId, description, userId, permissions = [] }: Assignment,
) => {
  const granteeds = await alreadyGranted(fiscalId);

  return Promise.all(
    clients
      .filter(({ id }) => !granteeds.includes(id))
      .map(async (client) => {
        await checkPermissionGrantLimit(client);

        return transaction(async () => {
          const { id: docId } = await DelinternetStorage.create(
            TYPE.GRANT_PERMISSION,
            1,
          );

          const grantPermission = await GrantPermission.create({
            clientId: client.id,
            userId,
            docId,
            isRevoked: true,
            description,
            authorizedName: name,
            authorizedFiscalId: fiscalId,
          });

          await GrantPermissionAssociation.bulkCreate(
            permissions.map((id) => {
              return {
                grantable_permission_id: id,
                grant_permission_id: grantPermission.id,
              };
            }),
          );

          return grantPermission;
        });
      }),
  );
};

const alreadyGranted = async (fiscalId: string) => {
  const alreadyGranted = await GrantPermission.findAll({
    where: { authorizedFiscalId: fiscalId, isRevoked: false },
  });

  return alreadyGranted.map(({ clientId }) => clientId);
};

const checkPermissionGrantLimit = async (client: AnyModel) => {
  const uniqueFiscalIdsCount = await GrantPermission.count({
    distinct: true,
    col: 'authorizedFiscalId',
    where: {
      clientId: client.id,
      isRevoked: false,
      done: true,
    },
  });

  throwIf(
    uniqueFiscalIdsCount > 2,
    'The maximum limit for grant permissions has been reached.',
  );
};
