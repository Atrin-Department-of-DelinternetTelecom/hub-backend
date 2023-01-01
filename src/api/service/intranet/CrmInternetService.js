'use strict';

const config = require('@config');
const CrmFixService = require('./CrmFixService');
const CrmTaskHelperService = require('./CrmTaskHelperService');
const GfContractInternetService = require('./GfContractInternetService');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const GfCrmContractService = require('./GfCrmContractService');
const CrmTaskService = require('./CrmTaskService');
const GfSectionService = require('./GfSectionService');
const GfBonusService = require('./Fee/GfBonusService');
const moment = require('moment');
const {
  intranet: { GfContractDataFix, GfContractUnpaid, CrTaskUserXref, GfContract },
  system: { User },
} = require('@models');
const { default: factory } = require('./Contract/Facades');
const { SERVICE } = require('@api/constants/contracts');
const {
  GfContractDataInternet,
} = require('@api/models/intranet/intranet_gf_contract_data_internet');

const assert = require('assert');

/**
 * pendingState:
 *
 * step1: hi ha direccio
 * step2: agendat
 * step2.5: installation done
 * step2.7: cpe or radius no well configured
 * waitingRadius: tot ok, esperant primera conexio de radius
 */
exports.sectionStateChanged = async function (contractId, pendingSate, userId) {
  if (config.get('intranet.disableCrmContracts', false))
    return {
      success: true,
    };

  switch (pendingSate) {
    case 'step1':
      // hi ha direccio
      return await this.agendation(contractId, userId);
    case 'step2': {
      // instalationDate and installerId are filled
      const installation = await exports.installation(contractId, userId);
      await GfCrmContractService.markAsExecuted(
        `agendation_${contractId}_INTERNET`,
      );

      return installation;
    }
    case 'step2.7':
      // create radiusCpeError event
      return await this.cpeRadiusError(contractId, userId);
    case 'waitingRadius':
    case 'done': {
      await GfCrmContractService.markAsExecuted(
        `supportIntroduceIp_${contractId}_INTERNET`,
        false,
      );
      await GfCrmContractService.markAsExecuted(
        `installation_${contractId}_INTERNET`,
        false,
      );
      await GfCrmContractService.markAsExecuted(
        `vip_installation_${contractId}_INTERNET`,
        false,
      );
      await GfCrmContractService.markAsExecuted(
        `agendation_${contractId}_INTERNET`,
        false,
      );
      await GfCrmContractService.markAsExecuted(
        `cpeRadiusError_${contractId}_INTERNET`,
        false,
      );

      // check if it is RADIO, if it is, create final event
      const technology = await GfContractInternetService.getTechnology(
        contractId,
      );

      if (technology == 'radio')
        await this.createRadioFinalEvent(contractId, userId);

      return { success: true };
    }
    default:
      return { success: true };
  }
};

exports.agendation = async function (contractId, userId) {
  // ensure contract is not agendated yet
  const {
    section: { row, status },
    type,
  } = await GfContractSectionStatusService.findForContract(contractId);

  if (row.installationDone)
    return {
      success: true,
      reason: 'Installation done, not needed',
    };

  if (moment(row.instalationDate).isAfter(moment()) && row.installatorUserId)
    return {
      success: true,
      reason: 'Agndation has been allready done',
    };

  const event = {
    subject: 'Internet Setup Scheduling',
    text: "Has d'anar a la secció del contracte i seleccionar dia, hora i instalador",
    metadata: {
      action: 'agendationDone',
      contractId: contractId,
    },
    onetime: true,
  };

  return await CrmTaskHelperService.createFullEvent(
    'agendation',
    contractId,
    event,
    'INTERNET',
    null,
    userId,
  );
};

/**
 * installation_9370_INTERNET
 * @param  {[type]} contractId [description]
 * @param  {[type]} userId     [description]
 * @return {[type]}            [description]
 */
exports.installation = async function (contractId, userId) {
  const [dataInternet, technology] = await Promise.all([
    GfContractDataInternet.findOne({ where: { contractId } }),
    GfContractInternetService.getTechnology(contractId),
  ]);

  assert(
    dataInternet?.instalationDate,
    'Invalid installation date for internet installation.',
  );

  const [installation, vipInstallation] = await Promise.all([
    CrmTaskHelperService.createFullEvent(
      `installation/${technology}`,
      contractId,
      {
        subject: 'internet installation',
        metadata: {
          action: 'installationFinished',
          contractId: contractId,
        },
        previsionDate: dataInternet.instalationDate,
        duration: dataInternet.installationDuration ?? 2,
        subscribers: [dataInternet.installatorUserId],
        onetime: true,
      },
      SERVICE.INTERNET,
      null,
      userId,
    ),
    CrmTaskHelperService.createFullEvent(
      `vip_installation/${technology}`,
      contractId,
      {
        subject: 'vip installation',
        metadata: { contractId: contractId },
        previsionDate: dataInternet.instalationDate,
        duration: 2 * (dataInternet.installationDuration ?? 2),
        onetime: true,
      },
      SERVICE.INTERNET,
      null,
      userId,
    ),
  ]);

  return vipInstallation;
};

exports.rescheduled = async function (contractId, userId) {
  const [dataInternet, technology] = await Promise.all([
    GfContractDataInternet.findOne({ where: { contractId } }),
    GfContractInternetService.getTechnology(contractId),
  ]);

  assert(
    dataInternet?.instalationDate,
    'Invalid installation date for internet installation.',
  );

  await CrmTaskHelperService.createFullEvent(
    `installation_rescheduled/${technology}`,
    contractId,
    {
      subject: 'Installation rescheduled',
      metadata: {
        action: 'installationFinished',
        contractId: contractId,
      },
      previsionDate: dataInternet.instalationDate,
      duration: dataInternet.installationDuration ?? 2,
      subscribers: [dataInternet.installatorUserId],
      onetime: false,
    },
    SERVICE.INTERNET,
    null,
    userId,
  );
};

exports.cpeRadiusError = async function (contractId, userId) {
  return await CrmTaskHelperService.createFullEvent(
    'cpeRadiusError',
    contractId,
    {
      subject: 'Error configuring RADIUS or CPE',
      metadata: {
        action: 'cpeRadiusSolved',
        contractId: contractId,
      },
      previsionDate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
      duration: 30,
      onetime: true,
    },
    'INTERNET',
    null,
    userId,
  );
};

/**
 * old contracts has never had this events
 * to prevent to create this events when contract reactive after blocked state
 * search for past blocked states
 * if any.. do no create event
 */
exports.createRadioFinalEvent = async function (contractId, userId) {
  const unpaid = await GfContractUnpaid.findOne({
    where: {
      contractId: contractId,
    },
  });

  if (unpaid !== null) return { success: false };

  return await CrmTaskHelperService.createFullEvent(
    'createRadioFinalEvent',
    contractId,
    {
      subject: 'Radio final event (AKA Provide IP)',
      metadata: { contractId: contractId },
      previsionDate: moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss'),
      duration: 30,
      onetime: true,
    },
    'INTERNET',
    null,
    userId,
  );
};

exports.contractStateChanged = async function (contractId, state, userId) {
  if (config.get('intranet.disableCrmContracts', false)) return;

  if (state == 'active') {
    await this.portafix(contractId, userId);
  } else if (state == 'suspended') {
    const installationEvent = `installation_${contractId}_INTERNET`;
    const vipInstallationEvent = `vip_installation_${contractId}_INTERNET`;

    if (await CrmTaskHelperService.eventExists(installationEvent))
      await CrmTaskHelperService.maskAsCanceled(installationEvent);

    if (await CrmTaskHelperService.eventExists(vipInstallationEvent))
      await CrmTaskHelperService.maskAsCanceled(vipInstallationEvent);
  }
};

exports.portafix = async function (contractId, userId) {
  const dataFixes = await GfContractDataFix.findAll({
    where: {
      internetSectionId: contractId,
    },
    include: [{ model: GfContract, as: 'contract' }],
  });

  for (const dataFix of dataFixes)
    await CrmFixService.portafix(dataFix.contractId, userId);
};

exports.onCrudSaved = async function (dataInternet, userId, old = {}) {
  // installation prevision date
  const technology = await GfContractInternetService.getTechnology(
    dataInternet.contractId,
  );

  const triggers = [
    `installation/${technology}_${dataInternet.contractId}_INTERNET`,
    `vip_installation_${dataInternet.contractId}_INTERNET`,
    `agendation_${dataInternet.contractId}_INTERNET`,
  ];

  await Promise.all(
    triggers.map(async (trigger) => {
      const task = await CrmTaskHelperService.getTaskByTrace(trigger);
      if (task) {
        const oldTask = task.get({ plain: true });

        const forceDontTrigger =
          trigger === `vip_installation_${dataInternet.contractId}_INTERNET` ||
          moment(task.previsionDate)
            .startOf('day')
            .isSame(moment(dataInternet.instalationDate).startOf('day'));

        const shouldTrigger = await syncUserIfChanged(
          dataInternet,
          task,
          forceDontTrigger,
          old.installatorUserId,
        );

        await task.update({
          previsionDate: dataInternet.instalationDate,
          executed: dataInternet.installationDone?.toString(),
        });

        await CrmTaskService.onAfterUpdateEvent(
          task,
          oldTask,
          userId,
          shouldTrigger,
        );
      }
    }),
  );
};

const syncUserIfChanged = async (
  dataInternet,
  crmTask,
  forceDontTrigger = true,
  oldInstallerId = null,
) => {
  const installer = await User.findOne({
    where: { userId: dataInternet.installatorUserId },
  });

  if (Number(installer?.crm_user_id) !== Number(oldInstallerId)) {
    await CrTaskUserXref.update(
      { status: 0 },
      { where: { taskId: crmTask.id, userId: oldInstallerId } },
    );
  }

  if (
    !installer?.crm_user_id ||
    crmTask.users.find((user) => user.userId === installer.crm_user_id)
  ) {
    return forceDontTrigger;
  }

  await CrTaskUserXref.create({
    taskId: crmTask.id,
    userId: installer.crm_user_id,
  });

  return false;
};

exports.onEventUpdated = async function (task, userId) {
  const pieces = task.refererTrace.split('_');

  if (pieces[0] === 'installation') {
    const metadata = JSON.parse(
      task.refererMetadata ? task.refererMetadata : '{}',
    );
    const { type, section } =
      await GfContractSectionStatusService.findForContract(metadata.contractId);
    const contractDataInternet = section.section.row;
    contractDataInternet.installationDone = task.executed;
    await contractDataInternet.save();
    const sectionId = await GfSectionService.getSectionIdByCode('INTERNET');
    await GfContractSectionStatusService.execute(
      metadata.contractId,
      sectionId,
      userId,
    );
  }
};

exports.onEventExecuted = async function (task, userId) {
  const metadata = JSON.parse(
    task.refererMetadata ? task.refererMetadata : '{}',
  );
  switch (metadata.action) {
    case 'agendationDone': {
      const { type, section } =
        await GfContractSectionStatusService.findForContract(
          metadata.contractId,
        );
      if (
        !['step2.5', 'step2', 'step2.7', 'waitingRadius'].includes(
          section.status.pendingState,
        ) &&
        !['done', 'suspended', 'blocked'].includes(section.status.state)
      ) {
        return {
          success: false,
          reason:
            'The contract does not appear to have all the required fields filled in to mark it as executed',
        };
      }

      const sectionId = await GfSectionService.getSectionIdByCode('INTERNET');
      await GfContractSectionStatusService.execute(
        metadata.contractId,
        sectionId,
        userId,
      );

      return {
        success: true,
      };
    }

    case 'installationFinished': {
      // $facade = new InternetFacade();
      // $ret = $facade->execute(metadata['contractId']);
      const section = await GfContractDataInternet.findOne({
        where: { contractId: metadata.contractId },
      });

      section.installationDone = 1;
      await section.update();

      const sectionId = await GfSectionService.getSectionIdByCode('INTERNET');
      await GfContractSectionStatusService.execute(
        metadata.contractId,
        sectionId,
        userId,
      );

      // MooWSManager::fire("server_installationFinished");

      return {
        success: true,
      };
    }

    case 'cpeRadiusSolved': {
      const sectionId = await GfSectionService.getSectionIdByCode('INTERNET');
      const result = await GfContractSectionStatusService.execute(
        metadata.contractId,
        sectionId,
        userId,
      );

      if ((result.pending === true, result.pendingState !== 'waitingRadius')) {
        // no solved
        return {
          success: false,
          reason: 'The problem does not seem to be solved',
        };
      }

      // ensure radius and cpe
      const facadeResult = await factory(SERVICE.INTERNET).doRadius(
        metadata.contractId,
      );

      if (!facadeResult?.success) {
        return {
          success: false,
          reason: 'The problem does not seem to be solved',
        };
      }

      // we must change
      return {
        success: true,
        setTraceOld: true,
      };
    }

    case 'errorBono': {
      return GfBonusService.activateAllPending(metadata.contractId, userId);
    }
  }

  return false;
};
