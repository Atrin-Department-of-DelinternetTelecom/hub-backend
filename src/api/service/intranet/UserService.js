'use strict';

const { MoozaicUser } = require('@models').moozaic;

exports.getPushWooshUserId = async () => {
  //TODONOTIFICATION
};

exports.getUserById = async (id) => {
  const user = await MoozaicUser.findByPk(id, { row: true });
  user.avatar = await this.getUserAvatar(id, { row: true });
  user.nickName = await this.getUserNickName(id, { row: true });
  return user;
};

exports.getUserAvatar = async (id) => {
  //TODONOTIFICATION
  return null;
};

exports.getUserNickName = async (id) => {
  //TODONOTIFICATION
  return null;
};
