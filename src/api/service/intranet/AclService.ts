import { AnyModel, moozaic } from '@api/models';

import { Op } from 'sequelize';

const { MoozaicUserRole } = moozaic;

export const hasRole = (role, value, app) => {
  return true; //MUSTIMPLEMENT
};

export const setRole = async ({
  userId,
  application = null,
  role = null,
  value = null,
  unique = false,
}: {
  userId: number;
  application: string | null | undefined;
  role: string | null | undefined;
  value: string | null | undefined;
  unique?: boolean;
}): Promise<AnyModel> => {
  const [userRole, created] = await MoozaicUserRole.findOrCreate({
    where: { userId, application, role },
    defaults: { value },
  });

  if (created === false && userRole.value === value) {
    return userRole;
  }
  await userRole.update({ value });

  if (unique === true) {
    await MoozaicUserRole.update(
      {
        status: 0,
      },
      {
        where: {
          userId,
          application,
          id: { [Op.not]: userRole.id },
        },
      },
    );
  }

  return userRole;
};
