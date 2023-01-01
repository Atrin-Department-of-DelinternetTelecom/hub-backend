import { system } from '@models';
import { getGfContractsId } from '@service/intranet/GfContractService';
import {
  findAndDelete,
  findAllEntities,
  findAndUpdate,
} from '@utils/request-handler';
import {
  respondCreated,
  respondSuccessWithPagination,
  respondNotFound,
  respondSuccess,
} from '@utils/response';
import { modelToJson } from '@utils/tools';
import { Op } from 'sequelize';
const { UserContract, User } = system;
import type { Query } from '@utils/controller-factory';

export const getUserContracts = async function (query: Query) {
  const { size, page } = query;

  let userContracts = await findAllEntities(
    query,
    UserContract,
    {
      is_active: true,
    },
    [
      {
        model: User,
        as: 'owner',
        required: false,
      },
    ],
  );

  userContracts = modelToJson(userContracts);

  for (const element of userContracts.rows) {
    const gfContract =
      (await getGfContractsId(element.contract_id))?.payload?.data ?? {};
    element.gfContract = gfContract;
  }

  return respondSuccessWithPagination(
    userContracts.rows,
    userContracts.count,
    size,
    page,
    query.url,
  );
};

export const getUserContractById = async function (id: number) {
  const userContract = (
    await UserContract.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
        },
      ],
    })
  )?.get({ plain: true });

  if (!userContract)
    return respondNotFound(`user contract with id:${id} not found.`);

  const gfContract = (await getGfContractsId(userContract.contract_id))?.payload
    ?.data;

  const history = await UserContract.findAll({
    where: {
      contract_id: userContract.contract_id,
      owner_id: { [Op.ne]: null },
    },
    include: [
      {
        model: User,
        as: 'owner',
      },
    ],
    order: [['id', 'ASC']],
  });

  userContract.history = history;
  userContract.gfContract = gfContract ?? {};
  return respondCreated(userContract);
};

export const getUserContractByGfContractId = async (gfContractId: number) => {
  const gfContract = await getGfContractsId(gfContractId);

  const userContract = (
    await UserContract.findOne({
      where: {
        contract_id: gfContractId,
        is_active: true,
      },
      include: [
        {
          model: User,
          as: 'owner',
        },
      ],
    })
  )?.get({ plain: true });

  if (!userContract) return respondSuccess({});

  userContract.gfContract = gfContract?.payload?.data;

  const history = await UserContract.findAll({
    where: {
      contract_id: userContract.contract_id,
      owner_id: { [Op.ne]: null },
    },
    include: [
      {
        model: User,
        as: 'owner',
      },
    ],
    order: [['id', 'ASC']],
  });

  userContract.history = history;

  return respondSuccess(userContract);
};

export const postUserContract = async function (
  body: {
    is_active: boolean;
    contract_id: number;
    owner_id: number;
    description: string;
  },
  creator_id: number,
) {
  body.is_active = true;

  await UserContract.update(
    { is_active: false },
    {
      where: {
        contract_id: body.contract_id,
      },
    },
  );

  const contractState = (await getGfContractsId(body.contract_id))?.payload
    ?.data?.state;

  if (contractState != 'active')
    return respondNotFound(
      'can not do this assignment because this contract does not exist or it is not active',
    );

  const userContract = (
    await UserContract.create({
      ...body,
      creator_id,
    })
  )?.get({ plain: true });

  const history = await UserContract.findAll({
    where: {
      contract_id: userContract.contract_id,
      owner_id: { [Op.ne]: null },
    },
    include: [
      {
        model: User,
        as: 'owner',
      },
    ],
    order: [['id', 'ASC']],
  });

  const owner = (await User.findByPk(userContract.owner_id))?.get({
    plain: true,
  });

  const gfContract = await getGfContractsId(userContract.contract_id);

  userContract.gfContract = gfContract?.payload?.data ?? {};
  userContract.owner = owner ?? {};
  userContract.history = history.map((e) => e.toJSON());

  return respondCreated(userContract);
};

export const deleteUserContract = function (id: number) {
  return findAndDelete(id, UserContract);
};

export const updateUserContract = async function (
  id: number,
  body: {
    owner_id: number;
    description: string;
  },
  creator_id: number,
) {
  const { owner_id = null, description = null } = body;

  let userContract = await UserContract.findByPk(id);

  userContract = userContract?.get({ plain: true });

  if (!userContract)
    return respondNotFound(`could not find user contract with id: ${id}`);

  let updatedUserContract: any = {};

  const activeContract = (
    await UserContract.findOne({
      where: {
        is_active: true,
        contract_id: userContract.contract_id,
      },
    })
  )?.get({ plain: true });

  if (
    Object.entries(activeContract).length &&
    (activeContract.owner_id === null || activeContract?.owner_id == owner_id)
  ) {
    await findAndUpdate(
      activeContract.id,
      {
        description,
        owner_id,
      },
      UserContract,
    );
    updatedUserContract = (
      await UserContract.findOne({
        where: {
          id: activeContract.id,
        },
      })
    )?.get({ plain: true });
  } else {
    await UserContract.update(
      { is_active: false },
      { where: { contract_id: userContract.contract_id } },
    );
    updatedUserContract = (
      await UserContract.create({
        contract_id: userContract.contract_id,
        owner_id: owner_id ?? null,
        is_active: true,
        creator_id,
        description,
      })
    )?.get({ plain: true });
  }

  const history = (
    await UserContract.findAll({
      where: {
        contract_id: userContract.contract_id,
        owner_id: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'owner',
        },
      ],
      order: [['id', 'ASC']],
    })
  )?.map((ele) => ele.toJSON());

  const gfContract = (await getGfContractsId(userContract.contract_id))?.payload
    ?.data;

  let owner = {};
  if (updatedUserContract.owner_id) {
    owner = (
      await User.findOne({
        where: {
          id: updatedUserContract.owner_id,
        },
      })
    )?.get({
      plain: true,
    });
  }

  updatedUserContract = {
    ...updatedUserContract,
    gfContract: gfContract ?? {},
    history,
    owner: owner ?? {},
  };

  return respondSuccess(updatedUserContract);
};
