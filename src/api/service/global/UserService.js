'use strict';

import { UserCalendar } from '@api/models/global/global_user_calendar';

const {
  system: { User, File, SignaturePad, AclUserRole, AclRole },
  moozaic: { MoozaicUser },
  intranet: { GfUser, CrmUser, GfDistributor, GfCollaborator },
} = require('@models');

const utils = require('@utils/tools');
const config = require('@config');
const reset_password = config.get('index.reset_password');

const { createHash } = require('crypto');
const {
  findAndGet,
  findAndDelete,
  getAllEntities,
} = require('@utils/request-handler');

const ejs = require('ejs');

const templates = config.get('index.templates');

const fs = require('fs');

const path = require('path');

const { getBucket } = require('@lib/minIO');

const { respondBadRequest, respondSuccess } = require('@utils/response');

const bcrypt = require('bcrypt');
const { firstPopulated } = require('@api/utils/helpers');
const { getMyCollaborator } = require('../intranet/GfCollaboratorService');
const { setRole } = require('../intranet/AclService');
const {
  setDefaultRules,
} = require('../intranet/CrmNotificationsPreferenceService');
const { camelCase } = require('lodash');
const { Op } = require('sequelize');
const { default: to } = require('await-to-js');
const { getTransporter, senders } = require('@lib/mailer');

/**
 * get list of users
 * get list of users
 *
 * returns Object
 **/
exports.getUsers = async function (query) {
  return getAllEntities(query, User, undefined, [
    {
      model: AclUserRole,
      as: 'role_item_associate',
      include: { model: AclRole, as: 'role' },
    },
    {
      model: GfUser,
      as: 'gf_user',
      required: false,
      include: [{ model: GfCollaborator, as: 'collaborator', required: false }],
    },
    {
      model: UserCalendar,
      as: 'calendar',
      required: false,
    },
  ]);
};

/**
 * create new user
 * add a user to system
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postUsers = async (payload, creator_id) => {
  const { color, pinned, selected_by_default, ...body } = payload;
  //set password
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(body.password, salt);
  body.password = hash;

  const userWithSameEmailOrUserName = await User.findOne({
    where: { [Op.or]: [{ email: body.email }, { username: body.username }] },
  });

  if (userWithSameEmailOrUserName) {
    if (userWithSameEmailOrUserName.email === body.email) {
      return respondBadRequest(`user with email ${body.email} already exist`);
    }
    return respondBadRequest(
      `user with username ${body.username} already exist`,
    );
  }

  //create new user
  const newUser = await User.create(body);
  const calendar = await UserCalendar.create({
    user_id: newUser.id,
    color: color || 'black',
    pinned: pinned || false,
    selected_by_default: selected_by_default || false,
  });

  //check role
  await syncRoleWithUser(newUser.id, body.role_id, creator_id);
  await syncIntranetUsers(newUser, body, creator_id);

  //get user with all related info
  return findAndGet(newUser.id, User, [{ model: AclRole, as: 'role_item' }]);
};

/**
 *
 * delete a single user
 *
 * id String id of table user
 * returns Object
 **/
exports.deleteUsersId = async function (id) {
  return await findAndDelete(id, User);
};

/**
 * Your GET endpoint
 * get a single user
 *
 * id String id of table user
 * returns Object
 **/
exports.getUsersId = async function (id) {
  return findAndGet(id, User, [
    { model: AclRole, as: 'role_item' },
    { model: MoozaicUser, as: 'moozaic_user', required: false },
    { model: CrmUser, as: 'crm_user', required: false },
    {
      model: GfUser,
      as: 'gf_user',
      required: false,
      include: [{ model: GfCollaborator, as: 'collaborator', required: false }],
    },
    {
      model: UserCalendar,
      as: 'calendar',
      required: false,
    },
  ]);
};

/**
 *
 * update a single user
 *
 * id String id of table user
 * body Body we can update some name or password or ... (optional)
 * returns Object
 **/
exports.putUsersId = async function (id, payload, creator_id) {
  const { color, pinned, selected_by_default, ...body } = payload;
  //get user and validation
  const user = await User.scope('securityScope').findOne({
    where: {
      id,
    },
    include: [
      { model: MoozaicUser, as: 'moozaic_user', required: false },
      { model: CrmUser, as: 'crm_user', required: false },
      { model: UserCalendar, as: 'calendar', required: false },
    ],
  });
  if (!user) return respondBadRequest(`user with id ${id} not found`);

  // check unique email if changed
  if (body.email && user.email !== body.email) {
    const userWithSameEmail = await User.findOne({
      where: { email: body.email },
    });

    if (userWithSameEmail) {
      return respondBadRequest(`user with email ${body.email} already exist`);
    }
  }

  //check unique username if changed
  if (body.username && user.username !== body.username) {
    const userWithSameUserName = await User.findOne({
      where: { username: body.username },
    });

    if (userWithSameUserName) {
      return respondBadRequest(
        `user with username ${body.username} already exist`,
      );
    }
  }

  //check passwrod
  if (body.password) {
    body.password = utils.generatePassword(body.password);
  } else {
    delete body.password;
  }

  //check role
  await syncRoleWithUser(id, body.role_id, creator_id);

  //update changes on user
  await user.update(body);
  if (!user.calendar) {
    await UserCalendar.create({
      color,
      selected_by_default,
      pinned,
      user_id: id,
    });
  } else {
    await UserCalendar.update(
      { color, selected_by_default, pinned },
      { where: { user_id: id } },
    );
  }

  await syncIntranetUsers(user, body);

  //get user with all related info
  return findAndGet(id, User, [
    { model: AclRole, as: 'role_item' },
    { model: MoozaicUser, as: 'moozaic_user' },
    { model: CrmUser, as: 'crm_user' },
  ]);
};

/**
 *
 * delete user avatar
 *
 * returns Object
 **/
exports.deleteUserAvatarId = async function (id) {
  const user = await User.scope('securityScope').findOne({
    where: {
      id,
    },
  });

  if (!user) return respondBadRequest(`user with id ${id} not found`);

  user.avatar_id = null;
  await user.save();

  return respondSuccess('user successfully deleted');
};

/**
 *
 * cahnge or set user avatar
 *
 * id String id of table user
 *
 * return response with status
 *
 * imp:
 * if folder exist, delete every ting inside folder and add image file
 * else => create folder with name = id and add image file
 *
 * create media record and check that we have only one record here
 *
 *
 */

/**
 * sync role with user
 * @param {number} user_id user id to sync
 * @param {number} role_id role id to sync
 * @param {number} creator_id id of operator click sync
 */
const syncRoleWithUser = async (user_id, role_id, creator_id) => {
  //check role
  if (role_id) {
    const userRole = await AclUserRole.findOne({
      where: {
        role_id,
        user_id,
      },
    });
    if (!userRole) {
      //delete role of the user (from table role_user)
      await AclUserRole.destroy({
        where: {
          user_id,
        },
      });

      //add new role (insert into role user)
      await AclUserRole.create({
        role_id,
        user_id,
        creator_id,
      });
    }
  } else if (role_id === null) {
    //delete role of the user (from table role_user)
    await AclUserRole.destroy({
      where: {
        user_id,
      },
    });
  }
};

exports.resetPassword = async function (email, url) {
  const user = await User.scope('securityScope').findOne({
    where: {
      email,
    },
  });

  if (!user) {
    return respondSuccess('email sent');
  }

  const reset_token = Math.random().toString().slice(2, 8);
  user.reset_password_token = reset_token;
  user.reset_password_expire = Date.now();
  user.reset_password_token_used = false;
  await user.save();

  const searchParamsForForgetPassword = new URL(
    config.get('index.frontRedirectUrl'),
  );
  searchParamsForForgetPassword.searchParams.append('type', 'resetPassword');
  searchParamsForForgetPassword.searchParams.append('u', email);
  searchParamsForForgetPassword.searchParams.append('c', reset_token);

  const html = await ejs.renderFile(
    path.resolve(templates, `reset-password.ejs`),
    { link: searchParamsForForgetPassword.toString() },
  );

  getTransporter().sendMail(
    {
      from: senders.default,
      to: email,
      subject: 'reset password',
      html,
    },
    function (err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log('email sent: ' + info.response);
      }
    },
  );

  return respondSuccess('email sent');
};

exports.changePassword = async function (body) {
  const { code, new_password, repeat_new_password, email } = body;
  const user = await User.scope('securityScope').findOne({
    where: {
      email,
      reset_password_token: code,
    },
  });

  if (
    user === null ||
    user.reset_password_token_used ||
    Date.now() - new Date(user.reset_password_expire).getTime() >
      reset_password.expire_time
  ) {
    //5 min
    return respondBadRequest('invalid code or email');
  }

  if (new_password !== repeat_new_password) {
    return respondBadRequest('password and repeat password must be same');
  }

  await user.update({
    reset_password_token_used: true,
    password: utils.generatePassword(new_password),
  });

  if (user.userId) {
    await MoozaicUser.update(
      {
        password: createHash('md5').update(body.new_password).digest('hex'),
      },
      {
        where: { id: user.userId },
      },
    );
  }

  return respondSuccess('password changed');
};

/**
 * check data in current system is synced with intranet and moozaic database
 * @param {object} hub_user user information in global_users table
 */
exports.sycUserWithIntranet = async (hub_user) => {
  const relatedMoozaicUser = await MoozaicUser.findOne({
    where: {
      email: hub_user.email,
      status: 1,
    },
  });
  if (relatedMoozaicUser && relatedMoozaicUser.id !== hub_user.userId) {
    hub_user.userId = relatedMoozaicUser.id;
  }

  const relatedGfUser = await GfUser.findOne({
    where: {
      email: hub_user.email,
      status: 1,
    },
  });
  if (relatedGfUser && relatedGfUser.id !== hub_user.gf_user_id) {
    hub_user.gf_user_id = relatedGfUser.id;
  }

  const relatedCrmUser = await CrmUser.findOne({
    where: {
      email: hub_user.email,
      status: 1,
    },
  });
  if (relatedCrmUser && relatedCrmUser.id !== hub_user.crm_user_id) {
    hub_user.crm_user_id = relatedCrmUser.id;
  }
  await hub_user.save();
};

/**
 * get all info related to a user
 * @param {number} id for select related user
 * @return {Promise<object>}
 */
exports.getMyRole = async (id) => {
  const user = await User.scope('securityScope').findByPk(id, {
    include: [
      {
        model: SignaturePad,
        as: 'signature_pad',
      },
      {
        model: AclUserRole,
        as: 'role_item_associate',
        include: {
          model: AclRole,
          as: 'role',
        },
      },
      {
        model: CrmUser,
        as: 'crm_user',
        required: false,
      },
      {
        model: MoozaicUser,
        as: 'moozaic_user',
        required: false,
      },
      {
        model: GfUser,
        as: 'gf_user',
        required: false,
      },
    ],
  });
  let roles = null;
  if (user.role_item_associate && user.role_item_associate[0]) {
    roles = global.roles[user.role_item_associate[0].role.name];
  }
  const { password: removedPassword, ...userWithoutPassword } = user.get({
    plain: true,
  });
  return respondSuccess(
    exports.userResponseDto({ roles, ...userWithoutPassword }),
  );
};

exports.userResponseDto = (userInfo) => {
  return {
    id: userInfo.id,
    name: userInfo.name,
    first_name: userInfo.first_name,
    last_name: userInfo.last_name,
    username: userInfo.username,
    email: userInfo.email,
    language: userInfo.moozaic_user?.language ?? 'en',
    roles: userInfo.roles,
    gf_user_id: userInfo.gf_user_id,
    userId: userInfo.userId,
    enable: userInfo.enable,
    signature_pad: userInfo.signature_pad,
  };
};

export const syncIntranetUsers = async (
  /** @type {import('@models').AnyModel} */ user,
  /** @type {Record<string, any>} */ body,
) => {
  const [moozaicUser] = await MoozaicUser.findOrCreate({
    where: { id: user.userId, uid: 90, status: [0, 1] },
  });

  const [crmUser, createdCrmUser] = await CrmUser.findOrCreate({
    where: { id: user.crm_user_id, uid: 90, status: [0, 1] },
  });
  const [gfUser] = await GfUser.findOrCreate({
    where: { id: user.gf_user_id, uid: 90, status: [0, 1] },
  });

  if (body.collaborator_id !== undefined) {
    await gfUser.update({ collaboratorId: body.collaborator_id });
  }

  await user.update({
    crm_user_id: crmUser.id,
    gf_user_id: gfUser.id,
    userId: moozaicUser.id,
  });

  // update moozaic user information
  await moozaicUser.update({
    language: firstPopulated([body.language, moozaicUser.language, 'en']),
    name: user.first_name + ' ' + user.last_name,
    user: user.email,
    email: user.email,
    status: 1,
    password: body.password
      ? createHash('md5').update(body.password).digest('hex')
      : moozaicUser.password,
  });
  // update crm user information
  await crmUser.update({
    userId: moozaicUser.id,
    name: user.first_name,
    nickName: `${user.first_name} ${user.last_name}`,
    email: user.email,
    senderId: 0,
    status: 1,
    color: firstPopulated([body.color, crmUser.color, 'rgb(255, 0, 77)']),
  });

  const gfUserAttributes = {
    userId: moozaicUser.id,
    email: user.email,
    name: user.first_name + ' ' + user.last_name,
    role: await guessGfUserRole(user),
  };

  // if user has distributor or collaborator force self
  const collaborator = await getMyCollaborator(moozaicUser.id);
  const distributor = await GfDistributor.findByPk(user.distributorId);

  switch (user.role) {
    case 'admin':
      gfUserAttributes.collaboratorId = 0;
      gfUserAttributes.distributorId = 0;
      break;
    case 'collaboratorAdmin':
    case 'collaboratorAdministrative':
    case 'seller':
      gfUserAttributes.distributorId = 0;
      break;
    case 'distributorAdmin':
    case 'distributorAdministrative':
      gfUserAttributes.collaboratorId = distributor?.collaboratorId;
      break;
  }

  if (collaborator && collaborator.master !== 1) {
    gfUserAttributes.collaboratorId = collaborator.id;
  }
  if (distributor) {
    gfUserAttributes.distributorId = distributor.id;
  }
  gfUserAttributes.status = 1;

  // update crm user information
  await gfUser.update(gfUserAttributes);

  await setRole({
    userId: moozaicUser.id,
    role: user.role,
    application: 'goufone',
    unique: true,
  });

  if (createdCrmUser === true) {
    await setDefaultRules(moozaicUser.id);
  }

  if (user.role === 'provider') {
    await setRole({
      userId: moozaicUser.id,
      role: user.role,
      application: 'pooh',
      unique: true,
    });
  }

  if (user.role !== 'provider' || createdCrmUser) {
    await setRole({
      userId: moozaicUser.id,
      role: 'admin',
      application: 'crm',
    });
  }
};

const guessGfUserRole = async (
  /** @type {import('@models').AnyModel} */ user,
) => {
  const userRoles = await user.getRole_item();
  const roles = {
    admin: 'superAdmin',
    collaboratorAdmin: 'collaboratorAdmin',
    collaboratorAdministrative: 'collaboratorAdministrative',
    distributorAdmin: 'distributorAdmin',
    distributorAdministrative: 'distributorAdministrative',
    seller: 'seller',
    installer: 'installer',
    signaturePad: 'signaturePad',
    provider: 'provider',
    externalAtc: 'External ATC',
    singleClient: 'Single client',
  };

  const matches = userRoles.find((userRole) => roles[camelCase(userRole.name)]);

  return matches !== undefined ? roles[camelCase(matches.name)] : 'nothingUser';
};

exports.moveUserAvatarsToMinIO = async () => {
  const avatarIds = [];
  const minIOCdrErrors = [];
  const avatars = {};
  const users = [];
  const bucketAddress = config.get('index.minIoBuckets.avatar');
  const bucketName = new URL(bucketAddress).pathname.replace('/', '');

  const minioClient = await getBucket(bucketAddress);
  (
    await User.findAll({
      where: {
        [Op.or]: [
          { avatar_id: { [Op.gt]: 0 } },
          { avatar_id: { [Op.not]: null } },
        ],
      },
    })
  ).forEach((user) => {
    avatarIds.push(user.avatar_id);
    users.push(user);
  });

  (await File.findAll({ where: { id: avatarIds } })).forEach(
    (avatar) => (avatars[avatar.id] = avatar),
  );

  for (const user of users) {
    if (!user.avatar && user.avatar_id) {
      const avatar = avatars[user.avatar_id];
      const avatarFile = fs.readFileSync(path.resolve(avatar.file));

      const newFileName = path.basename(avatar.file);
      const [minIOError, result] = await to(
        minioClient.putObject(bucketName, newFileName, avatarFile),
      );
      if (minIOError) {
        minIOCdrErrors.push(user.id);
        continue;
      }
      user.avatar = newFileName;
      await user.save();
    }
  }
  return respondSuccess('copy avatar from intranet server to minIO done');
};
