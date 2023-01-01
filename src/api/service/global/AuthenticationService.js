'use strict';

const bcrypt = require('bcrypt');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { User, SignaturePad, AclUserRole, AclRole } = require('@models').system;
const { MoozaicUser } = require('@models').moozaic;
const { GfUser, CrmUser } = require('@models').intranet;
const status = require('http-status');
const config = require('@config');
const { generatePassword } = require('@utils/tools');
const { sycUserWithIntranet, userResponseDto } = require('./UserService');
const { createHash } = require('crypto');

/**
 *
 * Login a user
 *
 * @param {Object} params body parameters
 * @param {Object} res express response object
 * @param {next} next express next object
 *
 * @return {object} 200|401|
 * returns Object
 **/
exports.postLogin = async function (params, res, next) {
  const { email, password } = params;
  let user = await User.scope('securityScope').findOne({
    where: { email },
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

  if (user === null) {
    // search in the moozaic user
    const moozaicUser = await MoozaicUser.findOne({
      where: {
        email,
        status: 1,
      },
    });

    const hashed = createHash('md5').update(password).digest('hex');

    // if user and password mached, copy to hrms
    if (moozaicUser !== null && moozaicUser.password === hashed) {
      // copy user from moozaic to hrms
      user = await User.create({
        first_name: moozaicUser.name,
        last_name: ' ',
        username: moozaicUser.user,
        role: 'user',
        dni: ' ',
        email: moozaicUser.email,
        password: generatePassword(password),
      });
      // ?? what we have to do with role relation
    }
  }
  if (!user) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: 'username/password is incorrect' });
  }
  if (!user.enable) {
    return res.status(status.FORBIDDEN).json({ message: 'user disabled' });
  }
  let result = await bcrypt.compare(password, user.password);

  if (!result) {
    // if user exist and password not mached, check
    //  the password in moozaic user (may be user changed on moozaic user)
    //  and update password here
    const moozaicUser = await MoozaicUser.findOne({
      where: {
        email,
        status: 1,
      },
    });

    const hashed = createHash('md5').update(password).digest('hex');

    if (moozaicUser?.password === hashed) {
      result = true;
      // update password in hrms system
      user.password = generatePassword(password);
      await user.save();
    }
  }

  if (!result) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: 'username/password is incorrect' });
  }

  //sync user with intranet and moozaic information
  await sycUserWithIntranet(user);

  // TODO: needs to be refactored but okay for now
  const roleName = user.role_item_associate[0]?.role?.name ?? '';
  const isSignPad = roleName === 'SignaturePad';

  //check user exist in intranet system but we should ignore this validation for signpads
  if (!isSignPad && (!user.userId || !user.gf_user_id || !user.crm_user_id)) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: 'user not exist in intranet system' });
  }

  if (!roleName) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: 'there is no role for this user' });
  }

  let roles = null;
  if (user.role_item_associate && user.role_item_associate[0]) {
    roles = global.roles[user.role_item_associate[0].role.name];
  }

  const { password: removedPassword, ...userWithoutPassword } = user.get({
    plain: true,
  });

  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.get('index.jwt.secret'),
    {},
  );

  return res.status(status.OK).json({
    ...userResponseDto({
      ...userWithoutPassword,
      roles,
    }),
    collaboratorId: Number(user.gf_user?.collaboratorId),
    token,
  });
};

exports.refreshToken = async function (auth, res, next) {
  const user = await User.scope('securityScope').findOne({
    where: { email: auth.email },
    include: [
      {
        model: SignaturePad,
        as: 'signature_pad',
      },
      {
        model: AclUserRole,
        as: 'role_item_associate',
        include: { model: AclRole, as: 'role' },
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

  const { password: removedPassword, ...userWithoutPassword } = user.get({
    plain: true,
  });
  const token = jwt.sign(
    { id: user.id, email: user.email },
    config.get('index.jwt.secret'),
    {},
  );
  const roles =
    user.role_item_associate && user.role_item_associate[0]
      ? global.roles[user.role_item_associate[0].role.name]
      : null;

  return res.status(status.OK).json({
    ...userResponseDto({
      ...userWithoutPassword,
      roles,
    }),
    collaboratorId: Number(user.gf_user?.collaboratorId),
    token,
  });
};
