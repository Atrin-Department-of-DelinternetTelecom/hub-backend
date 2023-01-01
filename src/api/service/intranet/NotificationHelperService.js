'use strict';

const { CrTask, InvoiceClient } = require('@models').intranet;

const { getUserById } = require('./UserService');

exports.getPushMetadata = async (taskId) => {
  const task = await CrTask.findByPk(taskId);
  const client = await InvoiceClient.findByPk(task.clientId);
  const user = await getUserById(client.moozaicUserId);
  let nickName = user.nickName;
  let avatar = user.avatar;
  if (!nickName) {
    nickName = `${client.name} ${client.surname1}`;
    avatar = null;
  }
  const ret = {};
  ret.content = nickName;
  ret.title = `[CRM] ${task.alias}`;
  ret.icon = avatar;
  ret.data = {
    command: 'crmEvent',
    params: {
      taskId: task.id,
      title: `hola que tal`,
    },
  };

  switch (task.refererKey) {
    case 'WytCrm':
      ret.pushUrlApp = 'coach';
      break;
    case 'GfCrm':
      ret.pushUrlApp = 'goufone';
      break;
    default:
      break;
  }

  return {
    success: true,
    data: ret,
  };
};
