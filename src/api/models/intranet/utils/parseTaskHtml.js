const cheerio = require('cheerio');
const strip_tags = require('locutus/php/strings/strip_tags');
const { groupBy } = require('lodash');

///////////////////////////////////incidence////////////////////////////////////////
/**
 * check html pattern is incidence or no
 * @param {cheerio.CheerioAPI} $
 * @return {boolean}
 */
const isIncidence = ($) => {
  const { contractId, refrenceCode, sectionType } = extractContract($);
  return !!contractId && !!refrenceCode && !!sectionType;
};

/**
 * extract incidence data
 * @param {cheerio.CheerioAPI} $
 * @returns {{
 *   contractId:string,
 *   sectionType:string,
 *   refrenceCode:string,
 * }}
 */
const extractIncidence = ($) => {
  return { ...extractContract($), type: 'incidence' };
};

/**
 * @param {cheerio.CheerioAPI} $
 */
const removeIncidenceExternal = ($) => {
  $('div').remove();
  $('table').remove();
  $('b').first().remove();
  return $;
};

/**
 * extract incidence data
 * @param {cheerio.CheerioAPI} $
 *
 * @return {{description:string,title:string}}
 */
const convertIncidenceToTelegramMessage = ($, task) => {
  const result = removeIncidenceExternal($);
  return {
    title: `🛑${task.alias}`,
    description: `${result.text().replace(/(?:\r\n|\r|\n)/g, '')}\n`,
  };
};

const convertActivateLinkedContractToTelegramMessage = ($, task) => {
  const extractedData =
    typeHandler[`Contracte d'internet enllaçat activat`].extract($);

  return {
    description: `from contract:${extractedData.fromContract.contractId}\nto contract:${extractedData.toContract.contractId}\n`,
    title: task.alias,
  };
};

/**
 * extract incidence data
 * @param {cheerio.CheerioAPI} $
 *
 * @return {{description:string,title:string}}
 */
const convertIncludedContractToTelegramMessage = ($, task) => {
  const contarctInfo = typeHandler.include_contract.extract($);
  const result = removeIncidenceExternal($);
  return {
    title: task.alias,
    description: `${result
      .text()
      .trim()
      .replace(/(?:\r\n|\r|\n)/g, '')}\ncontractId:${
      contarctInfo.contractId
    }\n`,
  };
};

////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////new unpaid invoice ///////////////////////////
/**
 * check html pattern is assistance or no
 * @param {cheerio.CheerioAPI} $
 * @returns {boolean}
 */
const isNewUnpaidInvoice = ($) => {
  const invoiceId =
    $('.editSection').attr('data-invoiceid') ||
    $('.pull-left').attr('data-invoiceid');
  return !!invoiceId;
};

const extractNewUnpaidInvoice = ($) => {
  const editSection = $('.editSection');
  const invoiceId =
    editSection.attr('data-invoiceid') ||
    $('.pull-left')
      .attr('data-invoiceid')
      .replace(/['"`]+/g, '');
  const pullLeft = $('.pull-left');
  const invoiceCode = pullLeft
    .text()
    .replace(/(\r\n|\n|\r)/gm, '')
    .trim();
  return { type: 'new_unpaid_invoice', invoiceCode, invoiceId };
};

/**
 * @param {cheerio.CheerioAPI} $
 */
const removeUnpaidInvoiceExternal = ($) => {
  $('div').remove();
  $('table').remove();
  $('b').first().remove();
  return $;
};

const convertUnpaidInvoiceToTelegramMessage = ($, task) => {
  const result = removeUnpaidInvoiceExternal($);
  return {
    description: `${result
      .text()
      .trim()
      .replace(/(?:\r\n|\r|\n)/g, '')}\n`,
    title: task.alias,
  };
};

const convertPaidTelegramMessage = ($, task) => {
  const result = removeUnpaidInvoiceExternal($);
  return {
    description: `${result
      .text()
      .trim()
      .replace(/(?:\r\n|\r|\n)/g, '')}\n`,
    title: task.alias,
  };
};
////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////assistance////////////////////////////////////
/**
 * check html pattern is assistance or no
 * @param {cheerio.CheerioAPI} $
 * @returns {boolean}
 */
const isAssist = ($) => {
  const { contractId, refrenceCode, sectionType } = extractContract($);
  const assistProp = $('.pull-right button').hasClass('formGfAssists');
  return !!assistProp && !!contractId && !!refrenceCode && !!sectionType;
};

/**
 * extract assistance data
 * @param {cheerio.CheerioAPI} $
 * @returns {{
 *   contractId:string,
 *   sectionType:string,
 *   assistanceId:string,
 *   refrenceCode:string,
 * }}
 */
const extractAssist = ($) => {
  const { contractId, refrenceCode, sectionType } = extractContract($);
  const isAssist = $('.pull-right button').hasClass('formGfAssists');
  const assistanceId = isAssist
    ? $('.pull-right button')
        .attr('data-id')
        ?.replace(/['"`]+/g, '') ?? undefined
    : undefined;
  return {
    type: 'assistance',
    contractId,
    refrenceCode,
    sectionType,
    assistanceId,
  };
};

/**
 * @param {cheerio.CheerioAPI} $
 */
const removeAssistExternal = ($) => {
  $('div').remove();
  $('table').remove();
  $('b').first().remove();
  return $;
};

const convertAssistanceToTelegramMessage = ($, task) => {
  const result = removeAssistExternal($);
  return {
    description: `${result
      .text()
      .trim()
      .replace(/(?:\r\n|\r|\n)/g, '')}\n`,
    title: task.alias,
  };
};
///////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////contract///////////////////////////////////////
/**
 *
 * @param {cheerio.CheerioAPI} $
 */
const includeContract = ($) => {
  const { contractId, refrenceCode, sectionType } = extractContract($);
  return !!contractId && !!refrenceCode && !!sectionType;
};

const extractContract = ($) => {
  let refrenceCode = undefined;
  const contractId =
    $('.editSection')
      .attr('data-contractid')
      ?.replace(/['"`]+/g, '') ?? undefined;

  if (contractId) {
    refrenceCode =
      $('.editContract')
        .text()
        ?.replace(/(\r\n|\n|\r)/gm, '')
        .trim(' ') ?? undefined;
  }
  const sectionType = $('.editSection').attr('data-section');

  return { type: 'include_contract', contractId, refrenceCode, sectionType };
};
/////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////linked-contract////////////////////////////////////
/**
 * check html pattern for linked contract
 * @param {cheerio.CheerioAPI} $
 * @returns {boolean}
 */
const isLinkedContract = ($) => {
  const sections = $('.editSection');

  const firstContractId = sections[0]?.attribs?.['data-contractid'];
  const firstSectionType = sections[0]?.attribs?.['data-section'];

  const secondContractId = sections[1]?.attribs?.['data-contractid'];
  const secondSectionType = sections[0]?.attribs?.['data-section'];

  if (
    firstContractId &&
    firstSectionType &&
    secondContractId &&
    secondSectionType
  ) {
    const editContracts = $('.editContract');
    const firstRefrenceCode =
      editContracts[0]?.children[0]?.data
        ?.replace(/(\r\n|\n|\r)/gm, '')
        .trim(' ') ?? undefined;
    const secondRefrenceCode =
      editContracts[1]?.children[0]?.data
        ?.replace(/(\r\n|\n|\r)/gm, '')
        .trim(' ') ?? undefined;
    return !!firstRefrenceCode && !!secondRefrenceCode;
  }

  return false;
};

/**
 * extract linked-contract data
 * @param {cheerio.CheerioAPI} $
 * @return {{
 *      fromContract:{
 *        contractId:string,
 *        sectionType:string,
 *        refrenceCode:string,
 *      },
 *      toContract:{
 *        contractId:string,
 *        sectionType:string,
 *        refrenceCode:string,
 *      }}}
 */
const extractLinkedContract = ($) => {
  const sections = $('.editSection');

  const firstContractId = sections[0]?.attribs?.['data-contractid'];
  const firstSectionType = sections[0]?.attribs?.['data-section'];

  const secondContractId = sections[1]?.attribs?.['data-contractid'];
  const secondSectionType = sections[0]?.attribs?.['data-section'];

  if (
    firstContractId &&
    firstSectionType &&
    secondContractId &&
    secondSectionType
  ) {
    const editContracts = $('.editContract');
    const firstRefrenceCode =
      editContracts[0]?.children[0]?.data
        ?.replace(/(\r\n|\n|\r)/gm, '')
        .trim(' ') ?? undefined;
    const secondRefrenceCode =
      editContracts[1]?.children[0]?.data
        ?.replace(/(\r\n|\n|\r)/gm, '')
        .trim(' ') ?? undefined;
    return {
      fromContract: {
        contractId: firstContractId,
        sectionType: firstSectionType,
        refrenceCode: firstRefrenceCode,
      },
      toContract: {
        contractId: secondContractId,
        sectionType: secondSectionType,
        refrenceCode: secondRefrenceCode,
      },
      type: 'linked_contract',
    };
  }
};
////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////linked-contract////////////////////////////////////
/**
 * check html pattern for change IBAN
 * @param {cheerio.CheerioAPI} $
 * @returns {boolean}
 */
const isChangeIBAN = ($) => {
  const title = $('b:first-of-type').text().replace(/\n/g, '').trim();
  if (title === 'Client IBAN changed') return true;
  return false;
};

const convertChangeIBANToTelegramMessage = ($, task) => {
  return {
    title: task.alias,
    description: task.aditionalText
      .replace(/  +/g, '')
      .replace(/\n/g, '')
      .replace('description', '')
      .replace('Client IBAN changed', '')
      .trim(),
  };
};
////////////////////////////////////////////////////////////////////////////////////////

const typeHandler = {
  Incidència: {
    check: isIncidence,
    extract: extractIncidence,
    telegram: convertIncidenceToTelegramMessage,
  },
  Incidence: {
    check: isIncidence,
    extract: extractIncidence,
    telegram: convertIncidenceToTelegramMessage,
  },
  'New Unpaid Invoice': {
    check: isNewUnpaidInvoice,
    extract: extractNewUnpaidInvoice,
    telegram: convertUnpaidInvoiceToTelegramMessage,
  },
  'Paid Unpaid Invoice': {
    check: isNewUnpaidInvoice,
    extract: extractNewUnpaidInvoice,
    telegram: convertPaidTelegramMessage,
  },
  Assistance: {
    check: isAssist,
    extract: extractAssist,
    telegram: convertAssistanceToTelegramMessage,
  },
  "Contracte d'internet enllaçat activat": {
    check: isLinkedContract,
    extract: extractLinkedContract,
    telegram: convertActivateLinkedContractToTelegramMessage,
  },
  'Client IBAN changed': {
    check: isChangeIBAN,
    telegram: convertChangeIBANToTelegramMessage,
  },
  include_contract: {
    check: includeContract,
    extract: extractContract,
    telegram: convertIncludedContractToTelegramMessage,
  },
};

/**
 * extract type,props and datas from html
 * @param {string} text html
 * @returns {{
 *      contractId:string|undefined,
 *      sectionType:string|undefined,
 *      assistanceId:string|undefined,
 *      invoiceCode:string|undefined,
 *      refrenceCode:string|undefined,
 *      title:string|undefined
 *      type?:string|undefined
 * }}
 */
exports.getInfoAndExtractPropsFromHtml = (text) => {
  const $ = cheerio.load(text);
  const title = $('b:first-of-type').text();
  const type = $('b:first-of-type').text().includes('Assist')
    ? $('b:first-of-type').text().split(' ')[0]
    : title;
  if (typeHandler[type]?.check($))
    return { ...typeHandler[type].extract($), title: type };

  if (typeHandler.include_contract.check($)) {
    return { ...typeHandler.include_contract.extract($), title: type };
  }

  return { type: 'no_pattern' };
};

exports.generateTelegramMessageBasedOnTask = async (task) => {
  const {
    intranet: { GfClient, CrmUser, CrTaskType },
  } = require('@models');

  const client = await GfClient.findOne({
    where: { invoiceClientId: task.clientId },
  });

  const crmUser = await CrmUser.findOne({ where: { userId: task.userId } });

  const taskType = await CrTaskType.findByPk(task.taskTypeId);

  const $ = cheerio.load(task.aditionalText);
  let telegramMessage = '';
  let description = task.aditionalText;
  let subject = task.alias;

  const title = $('b:first-of-type').text().replace(/\n/g, '').trim();
  const type = $('b:first-of-type').text().includes('Assist')
    ? $('b:first-of-type').text().split(' ')[0]
    : title;
  if (typeHandler[type]?.check($)) {
    const extractedData = typeHandler[type].telegram($, task);
    description = extractedData.description;
    subject = extractedData.title;
  } else if (typeHandler.include_contract.check($)) {
    const extractedData = typeHandler.include_contract.telegram($, task);
    description = extractedData.description;
    subject = extractedData.title;
  }

  telegramMessage = `✍🏻<b>Title:</b>\n${
    subject ?? 'Task'
  }\n\n 🔎<b>Type:</b> <code>${taskType.name}</code>\n\n
  🗒<b>Details:</b>\n <code>${description}</code>\n👤<b>Client:</b>\n${
    client.name
  }
    \n👤<b>Creator:</b>\n${crmUser?.nickName ?? 'system'}
    \n<a href="hub.delinternet.com/r?type=crmEvent&id=${
      task.id
    }">🔗Show In Hub</a>`;

  return finalizeMessage(telegramMessage);
};

const TaskTypeMap = {
  'incidence/assistance': 'Assistance',
  'incidence/sim_delivery': 'Sim Delivery',
  'installation/fibra': 'Fibra Installation',
  'installation/radio': 'Radio Installation',
};
exports.generateTelegramMessageBasedOnTaskCancellation = async (
  task,
  reason,
) => {
  const client = task.client;

  const {
    intranet: { CrmUser },
    system: { User },
  } = require('@models');
  const user = await User.findByPk(task.entity.technicianUserId);
  const crmUser = await CrmUser.findByPk(user.crm_user_id);
  const cancelcationHeader = `${TaskTypeMap[task.entity.type]} Task Canceled`;
  const description = task.entity.cancelReasonDescription
    ? task.entity.cancelReasonDescription
    : '-';
  const telegramMessage = `🚫<b> ${cancelcationHeader}</b>\n\n📋<b>Reason:</b> ${
    reason.label?.ca || reason.name
  }\n\n👤<b>Cancel·lat per:</b> ${
    crmUser.nickName
  }\n\n🗒<b>Descripció:</b>\n <code>${description}</code> \n\n👤<b>Client:</b> ${
    client.name
  }\n\n<a href="https://hub.delinternet.com/r?type=canceledTaskReschedule&id=${
    task.id
  }">🔗Reprogramar</a>`;

  return finalizeMessage(telegramMessage);
};
exports.generateTelegramMessageBasedOnTaskInstallation = async (task) => {
  const client = task.client;
  const {
    intranet: { CrmUser },
    system: { User },
  } = require('@models');
  const user = await User.findByPk(task.entity.technicianUserId);
  const crmUser = await CrmUser.findByPk(user.crm_user_id);
  const installationHeader = `${TaskTypeMap[task.entity.type]} Completed`;
  const telegramMessage = `✅<b> ${installationHeader}</b>\n\n👤<b>Installed By:</b> ${crmUser.nickName}\n\n👤<b>Client:</b> ${client.name}\n\n<a href="https://hub.delinternet.com/r?type=viewFinishedTask&id=${task.id}">🔗View</a>`;
  return finalizeMessage(telegramMessage);
};
const finalizeMessage = (telegramMessage) => {
  return strip_tags(telegramMessage.replace(/<\/p>/g, '\n'), '<b>,<a>,<code>');
};

const generateTelegramMessageForPendingTechnicianTask = async ({
  technicianId,
  numberOfPendings,
  numberOfCancelled,
  numberOfDone,
}) => {
  const {
    intranet: { CrmUser },
    system: { User },
  } = require('@models');
  const user = await User.findByPk(technicianId);
  const crmUser = await CrmUser.findByPk(user.crm_user_id);
  const telegramMessage = `<a href="https://hub.delinternet.com/r?type=technician&id=${technicianId}">👤${crmUser.nickName}</a> \n  ${numberOfDone} Done✅ \n  ${numberOfPendings} Pending⏳ \n  ${numberOfCancelled} Cancelled❌\n\n`;
  return finalizeMessage(telegramMessage);
};

exports.generateTelegramMessageForPendingTechnicianTasks = async (
  pendingTasks,
) => {
  const installationHeader = `today tasks report📃`;
  let telegramMessage = `<b> ${installationHeader}</b>\n\n`;

  const technicianTasks = groupBy(pendingTasks, 'userId');

  for (const technicianId in technicianTasks) {
    const technicianSplitedByState = groupBy(
      technicianTasks[technicianId],
      'technician_state',
    );
    telegramMessage += await generateTelegramMessageForPendingTechnicianTask({
      technicianId,
      numberOfPendings:
        Number(technicianSplitedByState.pending?.length ?? 0) +
        Number(technicianSplitedByState.in_progress?.length ?? 0),
      numberOfDone: technicianSplitedByState.done?.length ?? 0,
      numberOfCancelled: technicianSplitedByState.cancelled?.length ?? 0,
    });
  }

  const tasksSplitedByState = groupBy(pendingTasks, 'technician_state');
  telegramMessage = `${telegramMessage} \n total: \n  ${
    tasksSplitedByState.done?.length ?? 0
  } Done✅ \n  ${
    Number(tasksSplitedByState.in_progress?.length ?? 0) +
    Number(tasksSplitedByState.pending?.length ?? 0)
  } Pending⏳ \n  ${tasksSplitedByState.cancelled?.length ?? 0} Cancelled❌`;

  return finalizeMessage(telegramMessage);
};
