import { DISCOUNT_TYPE, TYPE } from '@api/constants/discount';
import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
import { errors } from '@api/http/http_errors';
import { User } from '@api/models/global/global_users';
import { InstallationReportAdditionalWork } from '@api/models/technician/installation_report_addidtional_works';
import { InstallationReportMaterial } from '@api/models/technician/installation_report_materials';
import { InstallationReport } from '@api/models/technician/installation_reports';
import { TechnicianAdditionalWork } from '@api/models/technician/technician_additional_works';
import { TechnicianMaterial } from '@api/models/technician/technician_materials';
import { getAllEntities } from '@api/utils/request-handler';
import { TechnicianTask } from '@models/technician/technician_tasks';
import assert from 'assert';
import { DateTime } from 'luxon';
import moment from 'moment';
import { CreationAttributes, Includeable, Sequelize } from 'sequelize';
import { DelinternetStorage } from '../documents/storages/DelinternetStorage';
import { createDiscount } from '../intranet/GfDiscountsScheduledService';
import { loadTask } from './Technician';
import { TaskTypes } from './tasks';
import { Assistance } from './tasks/Incidence/assistance';
import { FiberInstallation } from './tasks/installation/internet/fiber';
import { RadioInstallation } from './tasks/installation/internet/radio';
import { format } from './utils/address';
import {
  calculateEachMaterialCost,
  calculateReportCost,
} from './utils/calculate_report_cost';

import { intranet } from '@api/models';
const { GfDiscountsScheduled, GfContract } = intranet;

interface InstallationReportParams {
  taskId: number;
  clientObservation: string;
  technicianObservation: string;
  materials: { materialId: number; amount: number }[];
  additionalWorks: { additionalWorkId: number; amount: number }[];
  customOperationalCost?: number;
  customMaterialCost?: number;
  elapsedTime?: number;
  isAssistance?: boolean;
  description?: string;
  discount?: number;
}

const InstallationReportShallowRelations = [
  {
    model: InstallationReportMaterial,
    as: 'materials',
  },
  {
    model: InstallationReportAdditionalWork,
    as: 'additionalWorks',
  },
  {
    model: User,
    as: 'reviewedBy',
    required: false,
  },
] satisfies Includeable[];

const InstallationReportDeepRelations = [
  {
    model: InstallationReportMaterial,
    as: 'materials',
    required: false,
    include: [{ model: TechnicianMaterial, as: 'material', required: false }],
  },
  {
    model: GfDiscountsScheduled,
    as: 'discount',
    required: false,
  },
  {
    model: GfDiscountsScheduled,
    as: 'charge',
    required: false,
  },
  {
    model: InstallationReportAdditionalWork,
    as: 'additionalWorks',
    required: false,
    include: [
      {
        model: TechnicianAdditionalWork,
        as: 'additionalWork',
        required: false,
      },
    ],
  },
] satisfies Includeable[];

/**
 * Creates a new installation report with its materials and additional works in a transaction
 */
async function deepCreate(
  _values: CreationAttributes<InstallationReport>,
): Promise<InstallationReport> {
  const { materials, additionalWorks, ...values } = _values;
  const entity = await InstallationReport.sequelize!.transaction(
    async (transaction) => {
      const entity = await InstallationReport.create(values, {
        transaction,
      });

      if (materials) {
        await InstallationReportMaterial.bulkCreate(
          materials.map((e: any) => ({
            reportId: entity.id,
            ...e,
          })),
          {
            transaction,
          },
        );
      }

      if (additionalWorks) {
        await InstallationReportAdditionalWork.bulkCreate(
          additionalWorks.map((e: any) => ({
            reportId: entity.id,
            ...e,
          })),
          {
            transaction,
          },
        );
      }

      return entity;
    },
  );

  return entity;
}

/**
 * Updates an installation report with its materials and additional works in a transaction
 */
async function deepUpdate(
  entity: InstallationReport,
  _values: CreationAttributes<InstallationReport>,
): Promise<InstallationReport> {
  const { materials, additionalWorks, ...values } = _values;
  await InstallationReport.sequelize!.transaction(async (transaction) => {
    if (materials) {
      await InstallationReportMaterial.destroy({
        where: {
          reportId: entity.id,
        },
        transaction,
      });

      await InstallationReportMaterial.bulkCreate(
        materials.map((e: any) => ({
          reportId: entity.id,
          ...e,
        })),
        {
          transaction,
        },
      );
    }

    if (additionalWorks) {
      await InstallationReportAdditionalWork.destroy({
        where: {
          reportId: entity.id,
        },
        transaction,
      });

      await InstallationReportAdditionalWork.bulkCreate(
        additionalWorks.map((e: any) => ({
          reportId: entity.id,
          ...e,
        })),
      );
    }

    await entity.update(values, { transaction });
  });

  await entity.reload({
    include: InstallationReportShallowRelations,
  });

  return entity;
}

/**
 * Destroys an installation report with its materials and additional works in a transaction
 */
async function deepDestroy(entity: InstallationReport): Promise<void> {
  return InstallationReport.sequelize!.transaction(async (transaction) => {
    await InstallationReportAdditionalWork.destroy({
      where: {
        reportId: entity.id,
      },
      transaction,
    });
    await InstallationReportAdditionalWork.destroy({
      where: {
        reportId: entity.id,
      },
      transaction,
    });
    await entity.destroy({
      transaction,
    });
  });
}

export function getMaterials(query: unknown) {
  return getAllEntities(query, TechnicianMaterial, undefined, undefined, {
    attributes: {
      include: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM installation_report_materials
            WHERE installation_report_materials.material_id = TechnicianMaterial.id
          )`),
          'usageCount',
        ],
      ],
    },
  });
}

export function getAdditionalWorks(query: unknown) {
  return getAllEntities(query, TechnicianAdditionalWork, undefined, [], {
    attributes: {
      include: [
        [
          Sequelize.literal(`(
              SELECT COUNT(*)
              FROM installation_report_additional_works
              WHERE installation_report_additional_works.additional_work_id = TechnicianAdditionalWork.id
          )`),
          'usageCount',
        ],
      ],
    },
  });
}

export function getReports(query: unknown) {
  return getAllEntities(
    query,
    InstallationReport,
    undefined,
    [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
        where: {
          state: 'done',
        },
        include: [
          {
            model: GfContract,
            as: 'contract',
            required: false,
            attributes: [],
          },
        ],
      },
      {
        model: User,
        as: 'reviewedBy',
        required: false,
      },
      {
        model: GfDiscountsScheduled,
        as: 'discount',
        required: false,
      },
      {
        model: GfDiscountsScheduled,
        as: 'charge',
        required: false,
      },
    ],
    {
      attributes: {
        include: [
          [Sequelize.col('task.contract.reference'), 'contractReference'],
        ],
        exclude: [],
      },
    },
  );
}

export async function getReportByTaskId(taskId: number) {
  const report = await InstallationReport.findOne({
    where: {
      taskId,
    },
    include: [
      {
        model: InstallationReportMaterial,
        as: 'materials',
        include: [{ model: TechnicianMaterial, as: 'material' }],
      },
      {
        model: InstallationReportAdditionalWork,
        as: 'additionalWorks',
        include: [{ model: TechnicianAdditionalWork, as: 'additionalWork' }],
      },
    ],
  });

  if (!report) {
    throw new errors.NotFound(
      `InstallationReport with taskId:${taskId} not found`,
    );
  }

  return report;
}

export async function getReportByTypeId(
  type: TaskTypes | TaskTypes[],
  typeId: number,
) {
  const report = await InstallationReport.findOne({
    include: [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
        where: {
          type,
          typeId,
        },
      },
      ...InstallationReportDeepRelations,
    ],
  });

  if (!report) {
    throw new errors.NotFound(
      `InstallationReport not found with task.type:${type} and task.typeId:${typeId}`,
    );
  }

  const { task, ...rest } = report.toJSON() as InstallationReport;

  return {
    ...rest,
    scheduledDate: task.scheduledDate,
  };
}

export async function getReportByContractId(
  type: TaskTypes | TaskTypes[],
  gfContractId: number,
) {
  const report = await InstallationReport.findOne({
    include: [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
        where: {
          type,
          gfContractId,
        },
      },
      ...InstallationReportDeepRelations,
    ],
  });

  if (!report) {
    throw new errors.NotFound(
      `InstallationReport not found with task.type:${type} and task.gfContractId:${gfContractId}`,
    );
  }

  const { task, ...rest } = report.toJSON() as InstallationReport;

  return {
    ...rest,
    scheduledDate: task.scheduledDate,
  };
}

export async function getReportById(reportId: number) {
  const report = await InstallationReport.findOne({
    where: {
      id: reportId,
    },
    include: [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
      },
      ...InstallationReportDeepRelations,
    ],
  });

  if (!report) {
    throw new errors.NotFound(
      `InstallationReport not found with id:${reportId}`,
    );
  }

  const { task, ...rest } = report.toJSON() as InstallationReport;

  return {
    ...rest,
    scheduledDate: task.scheduledDate,
  };
}

export async function createReport(body: InstallationReportParams) {
  const {
    taskId,
    clientObservation,
    technicianObservation,
    additionalWorks,
    description,
  } = body;

  const isAssistance = body.isAssistance ?? false;

  const technicianTask = await TechnicianTask.findByPk(taskId, {
    include: [
      {
        model: User,
        as: 'technician',
        required: true,
      },
    ],
  });
  assert(technicianTask, `task with id:${taskId} not found`);

  const task = await loadTask(technicianTask);
  assert(task, `task with id:${taskId} not found`);

  const elapsedTime = body.elapsedTime
    ? body.elapsedTime
    : calculateElapsedTime(technicianTask);

  const { first_name, last_name } = technicianTask.technician;

  const reportForThisTask = await InstallationReport.findOne({
    where: {
      taskId,
    },
  });

  if (reportForThisTask) {
    throw new Error('InstallationReport for this task is already existed');
  }

  const materials = await calculateEachMaterialCost(body.materials, {
    isAssistance,
  });

  const report = await deepCreate({
    taskId,
    clientName: task.client.name,
    clientPhone: task.client.contactPhone,
    clientEmail: task.client.emailAddress,
    technicianName: `${first_name} ${last_name}`,
    address: format(task.address),
    city: task.address.city,
    isAssistance,
    clientObservation,
    technicianObservation,
    materials,
    additionalWorks,
    description,
    elapsedTime,
    ...calculateReportCost({
      isAssistance,
      elapsedTime,
      materials,
    }),
  });

  const { id } = await DelinternetStorage.create(
    'Delinternet-Documents-InstallationReport',
    task.entity.technicianUserId,
  );

  await report.update({
    // TODO(erfan) we should use `decId: id`. the del: prefix was a mistake
    docId: `del:${id}`,
  });

  return report;
}

export async function editReport(body: InstallationReportParams) {
  const {
    taskId,
    clientObservation,
    technicianObservation,
    additionalWorks,
    description,
    customMaterialCost,
    customOperationalCost,
  } = body;

  const technicianTask = await TechnicianTask.findByPk(taskId, {
    include: [
      {
        model: User,
        as: 'technician',
        required: true,
      },
    ],
  });
  assert(technicianTask, `task with id:${taskId} not found`);

  const report = await InstallationReport.findOne({
    where: {
      taskId,
    },
  });
  assert(report, `task with id:${taskId} not found`);

  const isAssistance = body.isAssistance ?? report.isAssistance;

  const materials = body.materials
    ? await calculateEachMaterialCost(body.materials, { isAssistance })
    : report.materials;

  const elapsedTime = body.elapsedTime ?? report.elapsedTime;

  const reportCostDetails = calculateReportCost({
    customMaterialCost,
    customOperationalCost,
    isAssistance,
    elapsedTime,
    materials,
  });

  await deepUpdate(report, {
    clientObservation,
    technicianObservation,
    isAssistance,
    description,
    materials,
    additionalWorks,
    elapsedTime,
    ...reportCostDetails,
  });

  return report;
}

/**
 * This function is stateless and does not change anything into database
 */
export async function calculateReportDetail(body: InstallationReportParams) {
  // elapsedTime can be also zero
  if (typeof body.elapsedTime !== 'number') {
    throw new errors.BadRequest('Elapsed time is required');
  }

  const isAssistance = body.isAssistance ?? false;
  const discount = body.discount ?? '0';

  const materials = await calculateEachMaterialCost(body.materials, {
    isAssistance,
  });

  return {
    materials,
    ...calculateReportCost({
      customMaterialCost: body.customMaterialCost,
      customOperationalCost: body.customOperationalCost,
      isAssistance,
      elapsedTime: body.elapsedTime,
      materials,
    }),
  };
}

const DescriptionMap: Record<string, string> = {
  [Assistance.type]: 'Servei tecnic',
  [FiberInstallation.type]: 'Instal.lació servei fibra optica',
  [RadioInstallation.type]: 'Instal.lació servei radio enllaç',
} as const;

export async function setReportReviewStatus(
  id: number,
  body: {
    reviewStatus: 'accepted' | 'rejected';
    chargeAmount: number;
    discountAmount: number;
    operatorDescription: string;
  },
  operatorInfo: { globalUserId: number; intranetUserId: number },
) {
  const { globalUserId, intranetUserId } = operatorInfo;
  const { reviewStatus, discountAmount, chargeAmount, operatorDescription } =
    body;
  const report = await InstallationReport.findByPk(id, {
    include: [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
      },
    ],
  });

  if (!report) throw new errors.NotFound(`report with id:${id} not found`);

  if (report.reviewStatus !== 'pending')
    throw new errors.BadRequest(`report is already reviewed`);

  assert(report.task.gfContractId);

  if (reviewStatus === 'rejected') {
    await report.update({
      reviewStatus,
      reviewedById: globalUserId,
      operatorDescription: operatorDescription ?? null,
    });
  } else if (reviewStatus === 'accepted') {
    if (!isValidChargeAndDiscount(chargeAmount, discountAmount))
      throw new errors.BadRequest('invalid discount or charge');

    const { discount, charge } = await insertDiscountAndCharge(
      report,
      { discountAmount, chargeAmount },
      intranetUserId,
    );

    await report.update({
      chargeId: charge?.id ?? null,
      discountId: discount?.id ?? null,
      reviewStatus,
      reviewedById: globalUserId,
      operatorDescription: operatorDescription ?? null,
    });
  }

  //load report with its charge and discount
  const reportWithChargeAndDiscount = await InstallationReport.findByPk(id, {
    include: [
      {
        model: TechnicianTask,
        as: 'task',
        required: true,
      },
      {
        model: GfDiscountsScheduled,
        as: 'discount',
        required: false,
      },
      {
        model: GfDiscountsScheduled,
        as: 'charge',
        required: false,
      },
    ],
  });

  return reportWithChargeAndDiscount;
}

async function insertDiscountAndCharge(
  report: InstallationReport,
  {
    discountAmount,
    chargeAmount,
  }: { discountAmount: number; chargeAmount: number },
  userId: number,
) {
  let chargeModel;
  if (chargeAmount) {
    const { discount: charge } = await createDiscount(
      {
        contractId: report.task.gfContractId as number,
        date: moment(),
        discountType: DISCOUNT_TYPE.FIX,
        type: TYPE.CHARGE,
        state: DISCOUNT_SCHEDULED.PENDING,
        // discount should be created with subTotalCost (without tax). the invoicing system will calculate the tax
        discount: Number(chargeAmount),
        description: DescriptionMap[report.task.type] ?? '',
        tpvCode: 'CHARGE_TECHNICIAN',
      },
      {
        userId,
      },
    );
    chargeModel = charge;
  }

  let discountModel;
  if (discountAmount) {
    const { discount } = await createDiscount(
      {
        contractId: report.task.gfContractId as number,
        date: moment(),
        discountType: DISCOUNT_TYPE.FIX,
        type: TYPE.DISCOUNT,
        state: DISCOUNT_SCHEDULED.PENDING,
        // discount should be created with subTotalCost (without tax). the invoicing system will calculate the tax
        discount: Number(discountAmount),
        description:
          'descompte per ' + (DescriptionMap[report.task.type] ?? ''),
        tpvCode: 'DISCOUNT_TECHNICIAN',
      },
      {
        userId,
      },
    );
    discountModel = discount;
  }

  return {
    charge: chargeModel,
    discount: discountModel,
  };
}

function isValidChargeAndDiscount(
  chargeAmount: number,
  discountAmount: number,
) {
  return (
    chargeAmount > 0 && discountAmount >= 0 && discountAmount <= chargeAmount
  );
}

function calculateElapsedTime(task: TechnicianTask) {
  return Math.floor(
    Math.abs(
      DateTime.fromJSDate(task.startedAt ?? new Date())
        .diffNow()
        .as('minutes'),
    ),
  );
}
