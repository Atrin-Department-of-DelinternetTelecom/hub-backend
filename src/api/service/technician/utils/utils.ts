import { User } from '@api/models/global/global_users';
import { system, intranet } from '@models';
import assert from 'assert';

const { GfClient, GfFeeGroup, GfDocumentType, GfSection } = intranet;

export const Includes = {
  GfClient: {
    model: GfClient,
    as: 'client',
    required: true,
    include: [
      {
        model: GfDocumentType,
        as: 'documentType',
      },
    ],
  },
  GfFeeGroup: {
    model: GfFeeGroup,
    as: 'fee_group',
    required: false,
    include: [
      {
        model: GfSection,
        as: 'sections',
        required: false,
      },
    ],
  },
};

export const ContractIncludes = [
  { model: GfFeeGroup, as: 'fee_group', required: false },
];

export async function convertMoozaicUserIdToSystemUserId(
  intranetUserId: number,
): Promise<number> {
  const user = await User.findOne({
    where: {
      userId: intranetUserId,
    },
    attributes: ['id'],
  });

  assert(user, `intranetUserId ${intranetUserId} is not found in GlobalUser`);

  return user.id;
}

export async function convertSystemUserIdToMoozaicUserId(
  systemUserId: number,
): Promise<number> {
  const user = await User.findOne({
    where: {
      id: systemUserId,
    },
    attributes: ['id', 'userId'],
  });

  assert(user, `systemUserId ${systemUserId} is not found in GlobalUser`);

  return user.userId;
}

export async function convertGfUserIdToSystemUserId(
  gfUserId: number,
): Promise<number> {
  const user = await User.findOne({
    where: {
      gf_user_id: gfUserId,
    },
    attributes: ['id'],
  });

  assert(user, `gfUserId ${gfUserId} is not found in GlobalUser`);

  return user.id;
}
