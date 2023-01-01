import { GrantPermission } from '@api/models/hrms/hrms_grant_permission';
import { DelinternetStorage } from '../documents/storages/DelinternetStorage';
import { Document } from '@api/models/global/global_document';

export const getAllForClientId = async function (clientId: number) {
  const entities = await GrantPermission.findAll({
    where: {
      clientId,
    },
    include: [
      {
        model: Document,
        as: 'document',
      },
    ],
  });

  return entities;
};

export const create = async function (
  body: {
    clientId: string;
    authorizedName: string;
    authorizedFiscalId: string;
    description: string;
  },
  userId: number,
) {
  const doc = await DelinternetStorage.create(
    'Delinternet-Documents-GrantPermission',
    userId,
  );

  const entity = await GrantPermission.create({
    ...body,
    userId,
    docId: doc.id,
  });

  return entity;
};

export const put = async function (
  id: number,
  body: {
    clientId: string;
    authorizedName: string;
    authorizedFiscalId: string;
    description: string;
  },
) {
  const entity = await GrantPermission.update(
    {
      ...body,
    },
    {
      where: {
        id,
      },
    },
  );

  return entity;
};
