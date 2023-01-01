import {
  ASSIGNABLE,
  ASSIGNABLE_HISTORY,
  SECTION_STATUS,
} from '@api/constants/statuses';
import { AnyModel, intranet } from '@api/models';
import {
  createDoc,
  genericDocs,
  refreshContractDocumentsBaseDataComplete,
} from '@service/documents/GfDocumentService';
import {
  execute,
  getState,
  setPendingState,
} from './GfContractSectionStatusService';
import { findAndGet, findAndUpdate } from '@utils/request-handler';

import CrmFixService from './CrmFixService';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfIvozFix } from '@api/models/intranet/intranet_gf_ivoz_fix';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { Op } from 'sequelize';
import OperadorIvozService from './OperadorIvozService';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import { OperadorLandlineHistory } from '@api/models/intranet/intranet_operador_landline_history';
import { SERVICE } from '@api/constants/contracts';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import _ from 'lodash';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { generateNumbers } from './FixCDR_GfTmpKamailioInvoiceService';
import { getSectionIdByCode } from './GfSectionService';
import moment from 'moment';
import niv from 'node-input-validator';
import { respondSuccess } from '@utils/response';
import to from 'await-to-js';

const { GfContract, GfContractSectionStatus, GfUser } = intranet;

niv.extend('isContract', async ({ value }: Record<string, string>) => {
  return (await GfContract.findByPk(value)) !== null;
});

niv.extend(
  'uniqueFixNumber',
  async (
    { value }: Record<string, string>,
    { inputs }: Record<string, Record<string, string>>,
  ) => {
    const model = await GfContractDataFix.findOne({
      where: { number: value },
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          where: {
            state: { [Op.not]: 'suspended' },
          },
        },
      ],
    });

    return model === null || String(model.id) === String(inputs.id);
  },
);

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
export const getGfContractDataFixsId = async (id: number) => {
  return findAndGet(id, GfContractDataFix);
};

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
export const getByContractId = async (contractId: number) => {
  const dataFix = await GfContractDataFix.findOne({
    where: {
      contractId: contractId,
    },
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: false,
      },
      {
        model: GfContract,
        as: 'internetSection',
        required: false,
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: {
              //@ts-ignore
              model: GfSection,
              as: 'sections',
              required: false,
            },
            required: false,
          },
          {
            model: GfClient,
            as: 'client',
            required: false,
          },
        ],
      },
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: false,
      },
      {
        model: GfUser,
        as: 'operator',
        required: false,
      },
      {
        model: GfIvozFix,
      },
    ],
  });

  assert(
    dataFix,
    new errors.NotFound(
      `${GfContractDataFix.name} with contractId:${contractId} was not found`,
    ),
  );

  return dataFix;
};

/**
 *
 * update a internet data record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected internet data (optional)
 * returns Object
 **/
export const putGfContractDataFixsId = async (
  id: number,
  body: Record<string, unknown>,
  user: AnyModel,
) => {
  const validator = await _validator(body, id);
  const dataFix = await GfContractDataFix.findByPk(id);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdate(id, body, GfContractDataFix).then(async (response) => {
    if (response.payload.code === 200) {
      await onAfterUpdate(response.payload.data, user, dataFix!);
    }

    return response;
  });
};

export const onAfterUpdate = async (
  dataFix: GfContractDataFix,
  user: AnyModel,
  old: GfContractDataFix,
) => {
  const section = await GfSection.findByCode(SERVICE.FIX);
  assert(section, 'GfSection FIX not found!!!');
  const { state } = await getState(dataFix.contractId, section.id);
  await checkAssignables(dataFix, user.userId, old);

  if (state === SECTION_STATUS.EMPTY) {
    // must be set as pending, if not, kamailio never will be executed
    await setPendingState(dataFix.contractId, section.id, user.userId);
  }

  const { state: newState } = await getState(dataFix.contractId, section.id);

  if (
    [
      SECTION_STATUS.PENDING,
      SECTION_STATUS.ERROR,
      SECTION_STATUS.EXECUTED,
    ].includes(newState)
  ) {
    await execute(dataFix.contractId, section.id, user.userId);
  }

  await checkAutoInstallation(
    dataFix.get({ plain: true }),
    dataFix,
    user.userId,
  );

  // refresh documents, because changing the data-fix can change the state of document
  // it'll take too long, do not await it
  refreshContractDocumentsBaseDataComplete(dataFix.contractId).catch(
    console.error,
  );
};

export const checkAssignables = async (
  dataFix: GfContractDataFix,
  userId: number,
  old: GfContractDataFix,
) => {
  const assignable = await OperadorLandline.findOne({
    where: { number: dataFix.number },
  });
  const previousAssigne = await OperadorLandline.findOne({
    where: { number: old.number || null },
  });

  // release previous
  if (previousAssigne) {
    await previousAssigne.update({ state: ASSIGNABLE.ASSIGNABLE });
    await OperadorLandlineHistory.create({
      gf_contract_id: dataFix.contractId,
      action_type: 'released',
      operador_landline_id: previousAssigne.id,
      operator_id: userId,
    });
  }

  // log new changes
  if (assignable && assignable?.state !== ASSIGNABLE.ASSIGNED) {
    await assignable.update({ state: ASSIGNABLE.ASSIGNED });
    await OperadorLandlineHistory.create({
      gf_contract_id: dataFix.contractId,
      action_type: ASSIGNABLE_HISTORY.ASSIGNED,
      operador_landline_id: assignable.id,
      operator_id: userId,
    });
  }
};

/**
 *  create or modify crm events for installator.
 *
 **/
export const checkAutoInstallation = async function (
  oldData: Record<string, any>,
  newData: AnyModel,
  userId: number,
) {
  await CrmFixService.onSectionFormSave(oldData, newData, userId);
};

/**
 * Create new validator instance.
 *
 * @return nva.Validator
 */
function _validator(body: Record<string, unknown>, id?: number) {
  body.internetSectionId = body.internetSectionId || null;
  body.autoExecuteDate = body.autoExecuteDate || null;
  body.aireExecuteDate = body.aireExecuteDate || null;

  return new niv.Validator({ id: id, ...body }, _validationRules(), {
    isContract: 'The contract id not exists.',
    uniqueFixNumber: 'This number value already taken.',
  });
}

/**
 * Get validation rules.
 *
 * @param  string formName
 * @param  int|undefined id
 * @return object
 */
function _validationRules() {
  return {
    internetSectionId: 'required|isContract',
    type: 'required|in:particular,company',
    autoExecuteDate: 'nullable|dateiso',
    aireExecuteDate: 'nullable|dateiso',
    number: 'required|uniqueFixNumber',
  };
}

export const ensureOfDocument = async function (
  contract: AnyModel,
  status: any,
) {
  try {
    // create generic doc
    await genericDocs(contract, status);
  } catch (e) {
    // statements
    console.log(e);
  }

  await ensureOfPortabilityDocument(contract.id);

  return { success: true };
};

export const ensureOfPortabilityDocument = async (contractId: number) => {
  const contract = await GfContract.findByPk(contractId, {
    include: { model: GfContractDataFix, as: 'dataFix' },
  });

  assert(
    contract,
    `[GfContractDataFixService@ensureOfPortabilityDocument] contract not found with id ${contractId}`,
  );

  if (contract.dataFix.portability !== 1) {
    return { success: true };
  }

  try {
    return createDoc({
      action: 'PORTABILIDAD',
      clientId: contract!.clientId,
      contractId: contract!.id,
      sectionCode: 'FIX',
    });
  } catch (e) {
    // statements
    console.log(e);
  }
};

/**
 *
 * @param {number} contractId
 * @returns
 */
export const getIvozRegisterStatus = async (contractId: number) => {
  const dataFix = await GfContractDataFix.findByContractId(contractId);

  assert(
    dataFix,
    new errors.NotFound(
      `GfContractDataFix with contractId:${contractId} was not found`,
    ),
  );

  const [error, response] = await to(
    OperadorIvozService.getRegisteredEndpointByDDI(dataFix.number as string),
  );

  return respondSuccess({
    ok: Boolean(response && response.success !== false),
    message: error?.message ?? 'Unknown',
  });
};

GfContractDataFix.afterCreate((instance, options) => {
  generateNumbers();
});

GfContractDataFix.afterUpdate((options) => {
  generateNumbers();
});

GfContractDataFix.afterBulkUpdate((options) => {
  generateNumbers();
});

export const executePendingKamailios = async () => {
  const executables = await selectExecutable();
  const executablesResult = [];
  const fixSectionId = await getSectionIdByCode(SERVICE.FIX);
  for (const { contractId } of executables) {
    executablesResult.push({
      ret: await execute(contractId, fixSectionId, 0),
    });
  }
  return executablesResult;
};

export const selectExecutable = async () => {
  return GfContractDataFix.findAll({
    attributes: ['contractId', 'id'],
    where: {
      autoExecuteDate: {
        [Op.between]: ['1970-01-01', moment().format('YYYY-MM-DD HH:mm:ss')],
      },
    },
    include: [
      {
        model: GfContractSectionStatus,
        as: 'section_status',
        where: { state: SECTION_STATUS.PENDING },
        attributes: ['id'],
      },
      { model: GfContract, as: 'contract', attributes: ['id'] },
    ],
    raw: true,
  });
};
