import * as TechnicianEvents from '../technician/Events';

import { ASSIGNABLE, ASSIGNABLE_HISTORY } from '@api/constants/statuses';
import { AnyModel, intranet, system } from '@api/models';
import { downloadFile, uploadFile } from '../file/fileService';
import { findAndGet, findAndUpdate } from '@utils/request-handler';
import { firstPopulated, isNullish } from '@api/utils/helpers';
import {
  genericDocs,
  refreshContractDocumentsBaseDataComplete,
} from '@service/documents/GfDocumentService';
import { respondCreated, respondSuccess } from '@utils/response';

import { ACS } from '@lib/sdk';
import { ActionEvent } from '@api/models/crud/crud_action_event';
import CrmInternetService from './CrmInternetService';
import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { DocumentView } from '../documents/types';
import { FacadeInternet } from './Contract/Facades';
import { File } from '@api/utils/controller-factory';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { Op } from 'sequelize';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { execute } from './GfContractSectionStatusService';
import { intranet as knexIntranet } from '@lib/knex';
import moment from 'moment';
import niv from 'node-input-validator';
import sharp from 'sharp';
import to from 'await-to-js';
import RadiusApiService from './RadiusApiService';
import { checkFirstConnection } from './GfContractInternetService';
import { User } from '@models/global/global_users';

const { GfContract, GfSection, GfUser } = intranet;
const { Metadata, Assignable, AssignableHistory } = system;

niv.extend(
  'preventAfterInstallation',
  async (
    { value, attr }: Record<string, any>,
    { inputs }: Record<string, any>,
  ) => {
    const dataInternet = await GfContractDataInternet.findByPk(inputs.id, {
      attributes: [attr, 'installationDone'],
      raw: true,
    });
    const finished = Number(
      inputs.installationDone || dataInternet!.installationDone,
    );
    // nothing to do
    if (!finished) {
      return true;
    }
    // compare for updates
    const oldValue = dataInternet[attr];

    return typeof oldValue === 'number'
      ? Number(oldValue) === Number(value)
      : moment(oldValue).isSame(moment(value));
  },
);

niv.extend('installatorUser', async ({ value }: Record<string, any>) => {
  return (
    !value ||
    null !==
      (await GfUser.findOne({
        where: {
          userId: value,
        },
      }))
  );
});

niv.extend(
  'installationLevel',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    // TODO
    //onst dataInternet = await GfContractDataInternet.findByPk(inputs.id);
    // if (AclManager::hasRole("installer") && $data['installationLevel'] != $oldData['installationLevel']){
    //   $data['errors']['installationLevel'][] = TextsManager::getText("You cannot change installation level when agendation is done");
    // }
    return true;
    // return isEmpty(value) || dataInternet.installationLevel == value;
  },
);

niv.extend(
  'nodeRadiusName',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const dataInternet = await GfContractDataInternet.findByPk(inputs.id);

    const found = await GfContractDataInternet.findOne({
      where: {
        nodeRadiusName: value,
        contractId: {
          [Op.not]: dataInternet!.contractId,
        },
      },
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          where: {
            state: {
              [Op.not]: 'suspended',
            },
          },
        },
      ],
    });

    return value === null || found === null;
  },
);

niv.extend(
  'cpeSnUnique',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    if (value === null) return true;

    const found = await GfContractDataInternet.unscoped().findOne({
      where: {
        cpeSn: value,
        status: 1,
        id: { [Op.not]: inputs.id },
      },
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
        },
      ],
    });

    return found === null;
  },
);

niv.extend(
  'requirementsOfCpe',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const dataInternet = (await GfContractDataInternet.findByPk(
      inputs.id,
    )) as AnyModel;

    return (
      value === null ||
      [
        firstPopulated([dataInternet.addressProvince, inputs.addressProvince]),
        firstPopulated([dataInternet.addressCity, inputs.addressCity]),
        firstPopulated([dataInternet.addressStreet, inputs.addressStreet]),
        firstPopulated([dataInternet.addressNumber, inputs.addressNumber]),
      ].filter((_) => _).length === 4
    );
  },
);

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
export const getGfContractDataInternetsId = async (id: number) => {
  const dataInternet = await GfContractDataInternet.findByPk(id);
  assert(dataInternet);

  return findAndGet(id, GfContractDataInternet);
};

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
export const getByContractId = async function (contractId: number) {
  const model = await GfContractDataInternet.findOne({
    where: { contractId: contractId },
    include: {
      all: true,
      required: false,
    },
  });

  if (model === null) {
    throw new errors.NotFound(
      `${GfContractDataInternet.name} with contractId:${contractId} was not found`,
    );
  }

  return respondSuccess(model.get({ plain: true }));
};

/**
 *
 * update a internet data record by id
 **/
export const putGfContractDataInternetsId = async function (
  id: number,
  body: Record<string, any>,
  user: AnyModel,
) {
  const validator = await _validator(body, id);
  const dataInternet = await GfContractDataInternet.findByPk(id);
  assert(
    dataInternet,
    `${GfContractDataInternet.name} with id:${id} was not found`,
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const response = await findAndUpdate(id, body, GfContractDataInternet);

  if (response.payload.code === 200) {
    await onAfterUpdate(response.payload.data, user, dataInternet as AnyModel);
    await syncCoWorkers(dataInternet, body);
    await syncTechnicianTask(dataInternet, response.payload.data, {
      globalUserId: user.id,
      intranetUserId: user.userId,
    });
    const contract = response.payload.data;

    await ActionEvent.forResourceUpdate({
      payload: body,
      userId: user.id,
      resource: contract,
      original: dataInternet,
    }).markAsFinished();
  }

  return response;
};

const parseCoWorkers = (coWorkers: unknown): number[] | undefined => {
  if (Array.isArray(coWorkers)) {
    return coWorkers.map(Number).filter(Boolean);
  }

  if (typeof coWorkers === 'string') {
    return coWorkers.split(',').map(Number);
  }
};

const syncCoWorkers = async (
  dataInternet: GfContractDataInternet,
  body: Record<string, unknown>,
) => {
  const coWorkers = parseCoWorkers(body.coWorkers);

  if (!Array.isArray(coWorkers)) {
    return;
  }

  await knexIntranet
    .table('installation_co_workers')
    .where('gf_contract_data_internet_id', dataInternet.id)
    .delete();

  if (coWorkers.length) {
    const rows = coWorkers.map((userId) => ({
      user_id: userId,
      gf_contract_data_internet_id: dataInternet.id,
    }));
    // insert to database
    await knexIntranet.table('installation_co_workers').insert(rows);
  }
};

export const onAfterUpdate = async (
  dataInternet: GfContractDataInternet,
  user: AnyModel,
  old: AnyModel,
) => {
  const contractId = dataInternet.contractId;
  const section = await GfSection.scope(['defaultScope', 'internet']).findOne();
  const changedWifiConfiguration =
    dataInternet.cpeWifiSsid !== old.cpeWifiSsid ||
    dataInternet.cpeWifiPassword !== old.cpeWifiPassword;

  assert(section);

  // get cpe info
  await updateCpeInfoFromRemote(dataInternet, changedWifiConfiguration);

  // update wifi configurations
  if (changedWifiConfiguration) {
    await updateCpeWifi(dataInternet);
  }

  await execute(contractId, section.id, user.userId);

  // check if installator date has been changed and update its event task
  await CrmInternetService.onCrudSaved(dataInternet, user.userId, old);

  // refresh documents, because changing the data-fix can change the state of document
  // it'll take too long, do not await it
  refreshContractDocumentsBaseDataComplete(dataInternet.contractId).catch(
    console.error,
  );

  await checkAssignables(dataInternet, user.userId, old);
};

export const checkAssignables = async (
  { contractId, staticIp }: AnyModel,
  userId: number,
  old: AnyModel,
) => {
  const assignable = await Assignable.findOne({
    where: { value: staticIp, type: 'ip' },
  });
  const previousAssigne = await Assignable.findOne({
    where: { value: old.staticIp || null, type: 'ip' },
  });

  // release previous
  if (previousAssigne) {
    await previousAssigne.update({ state: ASSIGNABLE.ASSIGNABLE });
    await AssignableHistory.create({
      contract_id: contractId,
      action_type: 'released',
      assignable_id: previousAssigne.id,
      operator_id: userId,
    });
  }

  // log new changes
  if (assignable && assignable?.state !== ASSIGNABLE.ASSIGNED) {
    await assignable.update({ state: ASSIGNABLE.ASSIGNED });
    await AssignableHistory.create({
      contract_id: contractId,
      action_type: ASSIGNABLE_HISTORY.ASSIGNED,
      assignable_id: assignable.id,
      operator_id: userId,
    });
  }
};

export const updateCpeInfoFromRemote = async function (
  dataInternet: GfContractDataInternet,
  changedWifiConfiguration = false,
) {
  if (!dataInternet.cpeSn) {
    // nothing to do when cpeSn not configured
    return;
  }

  const [error, device] = await to(
    ACS.devices.findBySerialNumber(dataInternet.cpeSn),
  );

  if (error) {
    // nothing to do when api failed
    console.error(error);
    return;
  }

  const wireless = device.wireless();
  const connection = device.connection();

  await Promise.all([
    updateCpeInfo(dataInternet.id, device),
    dataInternet.update({
      cpeDeviceId: device.deviceId(),
      cpeModel: device.model(),
      cpePppoeUsername: connection.username,
      cpePppoePassword: connection.password,
      cpeWifiSsid: changedWifiConfiguration
        ? dataInternet.cpeWifiSsid
        : wireless.password,
      cpeWifiPassword: changedWifiConfiguration
        ? dataInternet.cpeWifiPassword
        : wireless.password,
    }),
  ]);

  return dataInternet;
};

export const updateCpeWifi = async function (
  dataInternet: GfContractDataInternet,
) {
  if (!dataInternet.cpeSn) {
    // nothing to do when sn not registered
    return;
  }

  const [error] = await to(
    ACS.devices.updateWirelessCredentials(dataInternet.cpeSn, {
      username: dataInternet.cpeWifiSsid || '',
      password: dataInternet.cpeWifiPassword || '',
    }),
  );

  if (error) {
    console.error(error);
  }
};

export const downloadImage = async function (id: number, image: number) {
  const dataInternet = await GfContractDataInternet.findByPk(id);
  assert(
    dataInternet,
    `${GfContractDataInternet.name} with id:${id} was not found`,
  );
  // get from storage
  const { data: buffer } = await downloadFile(
    dataInternet.getImage(image),
    GfContractDataInternet.bucket,
  );

  return { buffer, filename: dataInternet.downloadName(image) };
};

export const uploadImage = async function (
  id: number,
  image: number,
  file: File,
) {
  const validator = new niv.Validator(
    { image: file, number: image },
    {
      image: 'required|mime:jpg,png,jpeg',
      number: 'required|min:1|max:13',
    },
  );
  ValidationException.throwUnless(await validator.check(), validator.errors);
  const dataInternet = await GfContractDataInternet.findByPk(id);
  assert(
    dataInternet,
    `${GfContractDataInternet.name} with id:${id} was not found`,
  );

  const convertedImage = await sharp(file.data).webp();
  const { filename } = await uploadFile(GfContractDataInternet.bucket, {
    data: await convertedImage.toBuffer(),
    mimetype: 'image/webp',
  });
  const imageName = GfContractDataInternet.imageName(image);
  await dataInternet.update({ [imageName]: filename });

  return respondCreated({ name: filename });
};

/**
 * Create new validator instance.
 *
 * @param  {object} body [description]
 * @param  {number=} id   [description]
 * @return niv.Validator
 */
function _validator(body: Record<string, any>, id?: number) {
  const attributes = { ...body };
  attributes.installationLevel = body.installationLevel || null;
  attributes.installationDone = body.installationDone || null;
  attributes.installatorUserId = parseInt(body.installatorUserId ?? 0) || null;
  attributes.radiusProfileSufix = body.radiusProfileSufix || null;
  attributes.cpeVoipProfile = body.cpeVoipProfile || null;
  attributes.nodeRadiusName = body.nodeRadiusName || null;
  attributes.cpeSn = body.cpeSn || null;
  attributes.id = id;

  return new niv.Validator(attributes, _validationRules(), {
    installatorUser: 'The installatorUserId not exists',
    installationLevel:
      'You cannot change installation level when agendation is done',
    nodeRadiusName: 'The nodeRadiusName already taken',
    requirementsOfCpe: 'Invalid installation addresses',
    cpeSnUnique: 'The cpeSn already taken',
    preventAfterInstallation:
      'You cannot schedule installation when agendation is done',
  });
}

/**
 * Get validation rules.
 * @return object
 */
function _validationRules() {
  return {
    installatorUserId: 'nullable|installatorUser',
    installationDone: 'nullable|boolean',
    installationLevel: 'nullable|in:level_1,level_2,level_3|installationLevel',
    radiusProfileSufix: 'nullable|in:MP,M',
    cpeVoipProfile: 'nullable|in:CHICHI,BELLPIG',
    nodeRadiusName: 'nullable|nodeRadiusName',
    cpeSn: 'nullable|requirementsOfCpe|cpeSnUnique',
    instalationDate: 'nullable:addressProvince',
  };
}

export const createOnOldWeb = async function () {
  // do some things
};

export const getCpeInfo = async function (dataInternetId: number) {
  const metadata = await getCpeInfoMetadata(dataInternetId);

  return metadata.value ? JSON.parse(metadata.value) : {};
};

const updateCpeInfo = async function (dataInternetId: number, device = {}) {
  const metadata = await getCpeInfoMetadata(dataInternetId);

  return metadata.update({ value: JSON.stringify(device) });
};

const getCpeInfoMetadata = async function (dataInternetId: number) {
  const [metadata] = await Metadata.findOrCreate({
    where: { key: `${GfContractDataInternet.name}_${dataInternetId}_cpeInfo` },
  });

  return metadata;
};

export const ensureOfDocument = async function (
  contract: AnyModel,
  status: any,
) {
  await genericDocs(contract, status);
};

const getCpeIdFromRemote = async (dataInternetId: number) => {
  const cpeInfo = await getCpeInfo(dataInternetId);

  return cpeInfo?._id ?? '';
};

export async function getInternetContractDoc(
  contractId: number,
): Promise<DocumentView | null> {
  const doc = await GfDoc.findOne({
    where: {
      type: 'Goufone-Documents-AltaInternet',
      contractId,
    },
    include: [
      {
        model: DocStatus,
        as: 'docStatus',
        required: true,
      },
    ],
    order: [['id', 'DESC']],
  });

  if (!doc) {
    return null;
  }

  return GfDoc.toDocumentView(doc);
}

export const bulkUpdateIpSix = async (dataInternets: AnyModel[]) => {
  // done use Promis.all since causes wrong result on bulk operations
  for (const dataInternet of dataInternets) {
    await dataInternet.ensureOfIpv6();
  }
  // update radius service
  return Promise.allSettled(
    dataInternets.map(({ contractId }) => FacadeInternet.doRadius(contractId)),
  );
};

const syncTechnicianTask = async (
  oldEntity: AnyModel,
  newEntity: AnyModel,
  {
    globalUserId,
    intranetUserId,
  }: {
    globalUserId: number;
    intranetUserId: number;
  },
) => {
  // no need to reschedule task when installation is done
  if (newEntity.installationDone) {
    return;
  }
  const hasTechnicianChanged =
    oldEntity.installatorUserId !== newEntity.installatorUserId;

  const hasInstallationDateChanged = !moment(oldEntity.instalationDate).isSame(
    newEntity.instalationDate,
  );

  const hasInstallation =
    oldEntity.installatorUserId && oldEntity.instalationDate;

  if (hasInstallationDateChanged || hasTechnicianChanged) {
    await TechnicianEvents.onDataInternetDateChanged(newEntity, {
      globalUserId,
      intranetUserId,
    });
  }

  if (hasInstallation && (hasInstallationDateChanged || hasTechnicianChanged)) {
    await CrmInternetService.rescheduled(oldEntity.contractId, intranetUserId);
  }
};

export const checkFirstConnectionByDataInternetId = async (id: number) => {
  if (process.env.TECHNICIAN_IGNORE_CHECK_FIRST_CONNECTION) {
    console.warn(
      'Technician: checking first connection were disabled by env vars',
    );
    return true;
  }
  const dataInternet = await GfContractDataInternet.findByPk(id);
  assert(dataInternet, `DataInternet with id: ${id} not found.`);

  const { nodeRadiusName } = dataInternet;
  if (!nodeRadiusName) {
    return 'Node Radius Name is empty';
  }

  const response = await RadiusApiService.getUserData(nodeRadiusName);

  assert(
    response.success,
    'RadiusApiService.getUserData result is not success',
  );
  if (!response.data.data.connection?.data?.Last_up) {
    return 'Router is not connected yet';
  }

  return true;
};

export const connectRouterByDataInternetId = async (
  dataInternetId: number,
  user: User,
) => {
  // this will activate the contract
  return checkFirstConnection({
    sectionId: dataInternetId,
    userId: user.userId,
  });
};
