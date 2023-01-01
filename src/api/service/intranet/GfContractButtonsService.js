'use strict';

const {
  getActualConditionsBySection,
  getContractSectionType,
} = require('./GfContractService');

const { createFullEvent } = require('./CrmTaskHelperService');
const nl2br = require('locutus/php/strings/nl2br');

const { respondSuccess } = require('@utils/response');

const getTechnology = async (type, contractId) => {
  if (type === 'INTERNET') {
    const conditions = await getActualConditionsBySection(contractId);
    if (conditions && conditions.internetTechnology) {
      return `${conditions.internetTechnology}/${type}`;
    }
  }
  return null;
};

exports.newInstallation = async (contractId, title, text, loginUserId) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_installation',
      contractId,
      {
        subject: title ? title : 'Instal·lació',
        text: nl2br(text),
        metadata: {
          action: 'custom_installation',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newUserQuery = async (contractId, title, text, loginUserId) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_user_query',
      contractId,
      {
        subject: title ? title : 'Consulta Usuari',
        text: nl2br(text),
        metadata: {
          action: 'custom_user_query',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newTecnicAction = async (contractId, title, text, loginUserId) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_tecnic_action',
      contractId,
      {
        subject: title ? title : 'Acció Tècnica',
        text: nl2br(text),
        metadata: {
          action: 'custom_tecnic_action',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newCustomAssistance = async (contractId, title, text, loginUserId) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_assistance',
      contractId,
      {
        subject: title ? title : 'Assistència Personalitzada',
        text: nl2br(text),
        metadata: {
          action: 'custom_assistance',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newCustomAdministrativeAction = async (
  contractId,
  title,
  text,
  loginUserId,
) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_administrative_action',
      contractId,
      {
        subject: title ? title : 'Acció Administrativa',
        text: nl2br(text),
        metadata: {
          action: 'custom_administrative_action',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newCustomSchedule = async (contractId, title, text, loginUserId) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_schecule',
      contractId,
      {
        subject: title ? title : 'Agendà Personalitzat',
        text: nl2br(text),
        metadata: {
          action: 'custom_schecule',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};

exports.newCustomInternalQuery = async (
  contractId,
  title,
  text,
  loginUserId,
) => {
  const sectionType = await getContractSectionType(contractId);
  const type =
    sectionType === 'INTERNET'
      ? await getTechnology(sectionType, contractId)
      : sectionType;
  return respondSuccess(
    await createFullEvent(
      'custom_internal_query',
      contractId,
      {
        subject: title ? title : 'Consulta Interna',
        text: nl2br(text),
        metadata: {
          action: 'custom_internal_query',
          contractId,
        },
      },
      type,
      null,
      loginUserId,
    ),
  );
};
