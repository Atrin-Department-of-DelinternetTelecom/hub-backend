import { errors } from '@api/http/http_errors';
import {
  GfSimDelivery,
  addressFields,
} from '@api/models/intranet/intranet_sim_deliveries';
import { getAllEntities } from '@api/utils/request-handler';
import { respondSuccess } from '@api/utils/response';
import { AnyModel, intranet } from '@models';
import * as SectionStatusService from './GfContractSectionStatusService';
import { syncTask } from './Crm_SimDeliveryService';
import moment from 'moment';
import * as TechnicianEvents from '../technician/Events';

const { GfContract, GfFeeGroup, GfSection, GfUser, CrTask } = intranet;

type AddressKey = (typeof addressFields)[number];

type CreationBody = {
  date: Date;
  technicianUserId: number;
} & {
  [key in AddressKey]?: string;
};

export const putGfSimDelivery = async function (
  contractId: number,
  body: CreationBody,
  user: AnyModel,
) {
  const contract = await GfContract.findByPk(contractId, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
          },
        ],
        required: true,
      },
    ],
  });

  if (!contract) {
    throw new errors.NotFound(`contract with id ${contractId} not found`);
  }

  const section = contract.fee_group?.sections[0];

  if (section.code !== 'CELL') {
    throw new errors.NotFound(`contract type is not cell`);
  }

  const { state } = await SectionStatusService.getState(contractId, section.id);

  if (state !== 'executed') {
    throw new Error('Contract section status is not executed');
  }

  const entity = await GfSimDelivery.findOne({
    where: {
      contractId,
    },
  });

  if (entity) {
    const oldEntity = entity.toJSON();
    await entity.update(body);
    await syncTechnicianTask(oldEntity, entity, {
      globalUserId: user.id,
      intranetUserId: user.userId,
    });
    await syncTask(entity, user.userId, 'simDelivery');
    return respondSuccess(entity);
  }

  const simDelivery = await GfSimDelivery.create({
    ...body,
    contractId,
    clientId: contract.clientId,
    userId: user.userId,
  });
  await syncTask(simDelivery, user.userId, 'simDelivery');

  return respondSuccess(simDelivery);
};

export const getGfSimDeliveries = async function (query: unknown) {
  return getAllEntities(
    query,
    GfSimDelivery,
    undefined,
    [
      {
        model: GfContract,
        as: 'contract',
        required: true,
      },
    ],
    { raw: true, nest: true },
  );
};

export const getContractSimDelivery = async function (contractId: number) {
  const entity = await GfSimDelivery.findOne({
    where: {
      contractId,
    },
    include: [
      {
        model: GfUser,
        as: 'technicianUser',
        required: false,
      },
    ],
  });

  if (!entity) {
    throw new errors.NotFound(
      `sim delivery with contractId:${contractId} not found`,
    );
  }

  return respondSuccess(entity);
};

export const setAsDone = async function (id: number, userId: number) {
  const entity = await GfSimDelivery.findByPk(id);
  if (!entity) {
    throw new errors.NotFound(`sim delivery with id ${id} not found`);
  }

  await entity.update({
    closed: true,
  });
  await syncTask(entity, userId, 'simDelivery');
};

const syncTechnicianTask = async (
  oldEntity: GfSimDelivery,
  newEntity: GfSimDelivery,
  {
    globalUserId,
    intranetUserId,
  }: {
    globalUserId: number;
    intranetUserId: number;
  },
) => {
  const hasTechnicianChanged =
    oldEntity.technicianUserId !== newEntity.technicianUserId;

  const hasDateChanged = !moment(oldEntity.date).isSame(newEntity.date);

  if (hasDateChanged || hasTechnicianChanged) {
    await TechnicianEvents.onSimDeliveryTaskDateChanged(newEntity, {
      globalUserId,
      intranetUserId,
    });
  }
};
