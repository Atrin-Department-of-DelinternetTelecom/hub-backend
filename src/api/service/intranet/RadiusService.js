// @ts-check
'use strict';

const { GfClient, GfContract, GfContractDataInternet } =
  require('@models').intranet;

const crypto = require('crypto');
const GfFeeService = require('./Fee/GfFeeService');
const GfContractInternetService = require('./GfContractInternetService');
const moment = require('moment');
const RadiusApiService = require('./RadiusApiService').default;
const config = require('@config');
const _ = require('lodash');
const { throwUnless } = require('@utils/helpers');
const { generate } = require('randomstring');

/**
 *
 * @param {string} username
 * @param {any=} node
 */
exports.getUserData = async function (username, node) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const pKey = 'insertUpdateUser-' + Date.now();
  await exports._noti('info', `Retrieving user info <b>${username}</b>`, pKey);
  const userData = await RadiusApiService.getUserData(username);

  if (!userData.success) await exports._noti('error', userData.reason);

  await exports._endNoti(pKey);

  return userData;
};

/**
 *
 * @param {number} contractId
 * @param {{ skipCoa: boolean }} arg0
 * @returns
 */
exports.updateFromContract = async function (
  contractId,
  { skipCoa } = { skipCoa: false },
) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const contract = await GfContract.findByPk(contractId);
  const conditions = await GfFeeService.getActualConditions(
    contract.feeGroupId,
  );

  if (exports.excludeFromRadius(conditions))
    return {
      success: true,
      reason: 'not needed',
    };

  const updated = await exports.insertUpdateUser(contractId);

  if (!updated.success) {
    await exports._noti('error', updated.reason);

    return updated;
  }
  const assign = await assignService(contractId, { skipCoa });

  if (!assign.success) {
    await exports._noti('error', assign.reason);

    return assign;
  }

  await exports._noti('success', 'Radius updated');

  return {
    success: true,
  };
};

exports.excludeFromRadius = function (conditions) {
  return conditions.internetExcludeFromRadius == 1;
};

/**
 *  create or retrive user if exists
 * also update password if changed
 *
 * @return
 */
exports.insertUpdateUser = async function (contractId) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const contract = await GfContract.findByPk(contractId);
  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId: contractId,
    },
  });
  const client = await GfClient.findByPk(contract.clientId);

  if (client === null || contract === null || dataInternet === null)
    return {
      success: false,
      reason: 'Bad contractId',
    };

  const pKey = 'insertUpdateUser-' + Date.now();

  await exports._noti('', 'insert/update radius user', pKey);

  // if contract has a radiusName check if it exists on radius dabatase
  if (dataInternet.nodeRadiusName) {
    const user = await exports._radiusNameExists(dataInternet.nodeRadiusName);

    if (user && dataInternet.nodeRadiusPassword == user.password) {
      // we don't need to do nothing
      // return as succed
      await exports._endNoti(pKey);

      return {
        success: true,
        exists: true,
        username: dataInternet.nodeRadiusName,
      };
    }

    if (user && dataInternet.nodeRadiusPassword != user.password) {
      // update password
      await RadiusApiService.setUserSpeed(
        dataInternet.nodeRadiusName,
        user.speed_up,
        user.speed_down,
        user.type == 'private',
        dataInternet.nodeRadiusPassword,
      );

      return {
        success: true,
        exists: true,
        username: dataInternet.nodeRadiusName,
      };
    }
  }

  // create username

  const uniqueString = dataInternet.nodeRadiusName
    ? dataInternet.nodeRadiusName
    : exports._getUniqueString(contract, dataInternet, client);

  if (await exports._radiusNameExists(uniqueString)) {
    // if exists in radius database, store on contract and return as success
    await dataInternet.update({
      nodeRadiusName: uniqueString,
    });
    await exports._noti(pKey);

    return {
      success: true,
      exists: true,
      username: uniqueString,
    };
  }

  await exports._noti(
    'info',
    `Creating new user in radius <b> ${uniqueString}</b>`,
  );
  const bandWidth = await GfContractInternetService.getRadiusGroup(contractId);
  const password = dataInternet.nodeRadiusPassword
    ? dataInternet.nodeRadiusPassword
    : exports._buildPassword(uniqueString);
  const payload = {
    radiusName: uniqueString,
    password: password,
    up: bandWidth.up,
    down: bandWidth.down,
    isPrivate: bandWidth.isPrivate,
  };
  const radiusUser = await RadiusApiService.createUser(payload);

  if (!radiusUser.success) {
    console.error(`[RadiusService][createUser]: ${JSON.stringify(payload)}`);
    console.error(radiusUser);
    return radiusUser;
  }

  await exports._noti(
    'success',
    `User created in radius <b>${uniqueString}</b>`,
  );

  await dataInternet.update({
    nodeRadiusName: uniqueString,
    nodeRadiusPassword: password,
  });

  await exports._endNoti(pKey);

  return {
    success: true,
    userName: uniqueString,
  };
};

/**
 *
 * @param {number} contractId
 * @param {{ skipCoa: boolean }} arg1
 * @returns
 */
const assignService = async function (
  contractId,
  { skipCoa } = { skipCoa: false },
) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const pKey = 'assignService-' + Date.now();
  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId: contractId,
    },
  });

  if (!dataInternet.nodeRadiusName) {
    throw new Error('No radiusName found on contract section');
  }

  const bandWidth = await GfContractInternetService.getRadiusGroup(contractId);
  const uniqueString = dataInternet.nodeRadiusName;
  const userSpeed = await RadiusApiService.setUserSpeed(
    uniqueString,
    bandWidth.up,
    bandWidth.down,
    bandWidth.isPrivate,
    dataInternet.nodeRadiusPassword,
  );

  // staticIp
  if (bandWidth.staticIp) {
    const staticIp = await RadiusApiService.setStaticIP(
      uniqueString,
      dataInternet.staticIp,
    );

    if (!staticIp.success) {
      throw new Error(`RadiusApiService.setStaticIP`, {
        cause: staticIp.error,
      });
    }
  } else {
    await RadiusApiService.destroyIP(uniqueString);
  }

  // ipv6
  if (dataInternet.IPv6_prefix) {
    const ipv6 = await RadiusApiService.setIpv6(
      uniqueString,
      dataInternet.IPv6_prefix,
    );

    if (!ipv6.success) {
      throw new Error(`RadiusApiService.setIpv6`, {
        cause: ipv6.error,
      });
    }
  } else {
    await RadiusApiService.destroyIPv6(uniqueString);
  }

  if (!skipCoa) {
    await exports.coa(contractId);
  }

  return userSpeed;
};

exports.blockContract = async function (contractId) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const pKey = 'blockContract-' + Date.now();
  exports._noti('', 'Block contract', pKey);

  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId: contractId,
    },
  });

  const uniqueString = dataInternet.nodeRadiusName;
  const result = await RadiusApiService.block(uniqueString);

  if (result.success) {
    exports._noti('success', 'Contract blocked');
  } else {
    exports._noti('error', result.error);
  }

  await exports._endNoti(pKey);
  await exports.coa(contractId);

  return result;
};

exports.restoreContract = async function (contractId) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const pKey = 'restoreContract-' + Date.now();
  exports._noti('', 'Restore contract', pKey);

  const result = await assignService(contractId);

  if (result.success) {
    exports._noti('success', 'Contract restored');
  } else {
    exports._noti('error', result.reason);
  }

  await exports._endNoti(pKey);
  return result;
};

exports._radiusNameExists = async function (username) {
  if (!RadiusApiService.getInstance().isConfigured()) {
    throw new Error(`Radius not configured`);
  }

  const user = await exports.getUserData(username);

  return user.success ? user.data.data.general : false;
};

exports._getUniqueString = function (contract, dataInternet, client) {
  return `${config.get('index.intranet.uid')}N${dataInternet.node ?? ''}-C${
    contract.id
  }-C${client.id}`;
};

exports._buildPassword = function (string) {
  return generate({
    charset: 'alphanumeric',
    capitalization: 'uppercase',
    length: 18,
  });
};

exports._noti = async function (type, text, code) {
  const notification = {
    code: code ? crypto.createHash('md5').update(code).digest('hex') : null,
    body: `<b>RADIUS:</b> ${text}`,
    color: '',
  };

  if (type == 'success') {
    notification.icon = 'check';
    notification.color = 'success';
  }

  if (type == 'error') {
    notification.icon = 'alert';
    notification.color = 'danger';
  }

  console.log(`[RadiusService]: ${JSON.stringify(notification)}`);

  // await MooWSManager::sendmeNoti(notification);
};

exports._endNoti = function (code) {
  // TODO
  // MooWSManager::sendmeNoti({
  //   terminate: true,
  //   code: code ? crypto.createHash('md5').update(code).digest('hex') : null,
  // });
};

/**
 *
 * @param {number} contractId
 * @returns {Promise<{ success: false, reason: string } | { success: true }>}
 */
exports.coa = async (contractId) => {
  const contract = await GfContract.findByPk(contractId);
  const conditions = await GfFeeService.getActualConditions(
    contract.feeGroupId,
  );

  if (exports.excludeFromRadius(conditions))
    return {
      success: false,
      reason: 'Not needed',
    };

  const dataInternets = await GfContractDataInternet.findAll({
    where: {
      contractId: contractId,
    },
  });

  if (dataInternets.length !== 1)
    return {
      success: false,
      reason: 'Sections for this contract != 1',
    };

  const nodeRadiusName = _.get(dataInternets, '0.nodeRadiusName');
  const notificationKey = nodeRadiusName + '-' + moment().format('x');

  await exports._noti(`Send coa for <b> ${nodeRadiusName}`, notificationKey);
  const coa = await RadiusApiService.coa(nodeRadiusName);
  await exports._endNoti(notificationKey);

  if (!coa.success) {
    const dataInternet = dataInternets[0];
    await exports._noti('error', `COA: ${coa.reason}`);
    await dataInternet.update({
      lastCoaMessage: coa.reason,
    });
  }

  return coa;
};

/**
 *
 * @param {string} radiusName
 * @returns {Promise<{
 *   first: Date;
 *   last: Date;
 *   radiusServer: string;
 *   clientIp: string;
 *   wan; string;
 * } | null>}
 */
exports.searchActivity = async function (radiusName) {
  const notificationKey = `${radiusName}-${moment().format('x')}`;

  await exports._noti(
    'info',
    `get user activity <b>${radiusName}</b>`,
    notificationKey,
  );

  const {
    data: {
      data: { connection },
    },
  } = await RadiusApiService.getUserData(radiusName);

  if (!connection) return null;

  const { First_connection, Last_up, RadiusServer, ClientSRC, ClientWAN } =
    connection.data;

  await exports._endNoti(notificationKey);

  return {
    first: First_connection ? new Date(First_connection) : null,
    last: Last_up ? new Date(Last_up) : null,
    radiusServer: RadiusServer,
    clientIp: ClientSRC,
    wan: ClientWAN,
  };
};

exports.delete = async (contractId) => {
  const section = await GfContractDataInternet.findOne({
    where: { contractId },
    attributes: ['contractId', 'nodeRadiusName'],
    raw: true,
  });

  throwUnless(section, 'Internet section not found for contract:' + contractId);

  const notificationKey = `${section.nodeRadiusName}-${Date.now()}`;

  await exports._noti(
    'info',
    `Removing <b>${section.nodeRadiusName}`,
    notificationKey,
  );

  const deleteResult = section.nodeRadiusName
    ? await RadiusApiService.delete(section.nodeRadiusName)
    : { success: true };
  await exports._endNoti(notificationKey);

  return deleteResult;
};
