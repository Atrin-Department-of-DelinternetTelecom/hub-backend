'use strict';

const {
  AclRole,
  User,
  AclUserRole,
  AclRoleRelation,
  AclRelation,
  AclApp,
  AclMenu,
  AclAction,
} = require('@models').system;

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
  createCatch,
} = require('@utils/request-handler');

const {
  respondBadRequest,
  respondSuccess,
  respondNotFound,
} = require('@utils/response');

const _ = require('lodash');

const moment = require('moment');

const { getRoles: updateGlobalRole } = require('./Roles');

/**
 *
 * delete a role record by id
 *
 * id String
 * returns Object
 **/
exports.deleteRolesId = async function (id) {
  const role = await AclRole.findByPk(id);
  if (!role) return respondNotFound(`role with ${id} not found`);
  await role.destroy();

  const deletedAt = moment().format('YYYY-MM-DD HH:mm:ss');
  await AclRoleRelation.update(
    { deletedAt },
    {
      where: { role_id: role.id },
    },
  );
  await AclUserRole.update({ deletedAt }, { where: { role_id: role.id } });
  await updateGlobalRole();
  return respondSuccess(`entity successfully deleted`);
};

/**
 * Your GET endpoint
 * get all role(information) record
 *
 * returns Object
 **/
exports.getRoles = async function (query) {
  return await getAllEntities(query, AclRole);
};

/**
 * Your GET endpoint
 * get single role record by id
 *
 * id String
 * returns Object
 **/
exports.getRolesId = async function (id) {
  return await findAndGet(id, AclRole);
};

/**
 *
 * add a role record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postRoles = async function (body, creator_id) {
  body.creator_id = creator_id;
  const newRole = await createCatch(body, AclRole);
  await updateGlobalRole();
  return newRole;
};

/**
 *
 * update a role record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected role (optional)
 * returns Object
 **/
exports.putRolesId = async function (id, body) {
  const role = await findAndUpdate(id, body, AclRole);
  await updateGlobalRole();
  return role;
};

exports.attachRoleToPermission = async (body, creator_id) => {
  const { acl_app_id, acl_menu_id, role_id } = body;

  const relation = await AclRelation.findOne({
    where: {
      acl_app_id: acl_app_id ? acl_app_id : null,
      acl_menu_id: acl_menu_id ? acl_menu_id : null,
    },
  });

  if (_.isNull(relation)) {
    return respondNotFound('relation not found');
  }

  if (
    !_.isNull(role_id) &&
    !_.isUndefined(role_id) &&
    _.isNull(await AclRole.findByPk(role_id))
  ) {
    return respondNotFound('role not found');
  }

  const relation_id = relation.id;
  if (relation.acl_app_id === null) {
    //check that we dont have value with app_id null
    const roleRlation = await AclRoleRelation.findOne({
      where: {
        role_id,
      },
      include: {
        model: AclRelation,
        as: 'permission',
        where: {
          acl_app_id: null,
        },
      },
    });

    if (!_.isNull(roleRlation)) {
      return respondBadRequest(` this role, already have this permission `);
    }

    // delete all befor role and add new role
    await AclRoleRelation.destroy({
      where: {
        role_id,
      },
    });

    await AclRoleRelation.create({
      role_id,
      relation_id,
      creator_id,
    });
  } else {
    if (relation.acl_menu_id === null) {
      //check that we dont have menu wiht app_id
      const roleRlation = await AclRoleRelation.findOne({
        where: {
          role_id,
        },
        include: {
          model: AclRelation,
          as: 'permission',
          where: {
            acl_app_id: relation.acl_app_id,
            acl_menu_id: null,
          },
        },
      });

      const otherRoleRelation = await AclRoleRelation.findOne({
        where: {
          role_id,
        },
        include: {
          model: AclRelation,
          as: 'permission',
          where: {
            acl_app_id: null,
          },
        },
      });

      if (!_.isNull(roleRlation) || !_.isNull(otherRoleRelation)) {
        return respondBadRequest(` this role, already have this permission `);
      }

      const removeRelations = await AclRelation.findAll({
        where: {
          acl_app_id: relation.acl_app_id,
        },
      });

      const removeRelationIds = [];
      for (const removeRelation of removeRelations) {
        removeRelationIds.push(removeRelation.id);
      }

      await AclRoleRelation.destroy({
        where: {
          role_id,
          relation_id: removeRelationIds,
        },
      });

      await AclRoleRelation.create({
        role_id,
        relation_id,
        creator_id,
      });
    } else {
      const roleRlation = await AclRoleRelation.findOne({
        where: {
          role_id,
        },
        include: {
          model: AclRelation,
          as: 'permission',
          where: {
            acl_app_id: relation.acl_app_id,
            acl_menu_id: relation.acl_menu_id,
          },
        },
      });

      const otherRoleRelation = await AclRoleRelation.findOne({
        where: {
          role_id,
        },
        include: {
          model: AclRelation,
          as: 'permission',
          where: {
            acl_app_id: relation.acl_app_id,
            acl_menu_id: null,
          },
        },
      });

      const otherRoleRelationForAllApp = await AclRoleRelation.findOne({
        where: {
          role_id,
        },
        include: {
          model: AclRelation,
          as: 'permission',
          where: {
            acl_app_id: null,
            acl_menu_id: null,
          },
        },
      });

      if (
        !_.isNull(roleRlation) ||
        !_.isNull(otherRoleRelation) ||
        !_.isNull(otherRoleRelationForAllApp)
      ) {
        return respondBadRequest(` this role, already have this permission `);
      }

      await AclRoleRelation.create({
        role_id,
        relation_id,
        creator_id,
      });
    }
  }

  await require('@service/acl/Roles').getRoles();
  //return role added
  return respondSuccess('relation added');
};

exports.attachRoleToUser = async (body, creator_id) => {
  const { role_id, user_id } = body;

  //check user and role exist (import it)
  if (
    _.isNull(role_id) ||
    _.isUndefined(role_id) ||
    _.isNull(await AclRole.findByPk(role_id))
  ) {
    return respondNotFound('role not found');
  }

  if (
    _.isNull(user_id) ||
    _.isUndefined(user_id) ||
    _.isNull(await User.findByPk(user_id))
  ) {
    return respondNotFound('user not found');
  }

  const userRole = await AclUserRole.findOne({
    where: {
      role_id,
      user_id,
    },
  });

  if (!_.isNull(userRole)) {
    return respondBadRequest('this role already exist');
  }

  //delete role of the user (from table role_user)
  await AclUserRole.destroy({
    where: {
      user_id,
    },
  });

  //add new role (insert into role user)
  const newUserRole = await AclUserRole.create({
    role_id,
    user_id,
    creator_id,
  });

  //return role added
  return respondSuccess(
    await AclUserRole.findByPk(newUserRole.id, {
      include: [
        {
          model: AclRole,
          as: 'role',
        },
        {
          model: User,
          as: 'user',
        },
      ],
    }),
  );
};

exports.checkPermision = (role, api_method, api_path) => {
  let match = false;
  Object.keys(role).forEach((app) => {
    Object.keys(role[app]).forEach((menu) => {
      Object.keys(role[app][menu].actions).forEach((controller) => {
        if (
          role[app][menu].actions[controller].api_path === api_path &&
          role[app][menu].actions[controller].api_method === api_method
        ) {
          match = true;
        }
      });
    });
  });
  return match;
};

exports.getAllAccess = async () => {
  return respondSuccess(global.roles);
};

exports.getRolesInfo = async (query) => {
  return await getAllEntities(query, AclRoleRelation, undefined, [
    {
      model: AclRelation,
      as: 'permission',
      include: [
        {
          model: AclApp,
          as: 'app',
        },
        {
          model: AclMenu,
          as: 'menu',
        },
      ],
    },
    {
      model: AclRole,
      as: 'role',
    },
  ]);
};

exports.getRolesOfUser = async (query) => {
  return await getAllEntities(query, AclUserRole, undefined, [
    {
      model: User,
      as: 'user',
    },
    {
      model: AclRole,
      as: 'role',
    },
  ]);
};

exports.removePermissionOfRole = async (id) => {
  const rolePermission = await AclRoleRelation.findByPk(id);
  if (_.isNull(rolePermission)) {
    return respondNotFound(`role_permission with id ${id} not found`);
  }

  await AclRoleRelation.destroy({
    where: {
      id,
    },
  });
  await require('@service/acl/Roles').getRoles();
  return respondSuccess('permission of role, deleted');
};

exports.removeRoleOfUser = async (id) => {
  const userRole = await AclUserRole.findByPk(id);
  if (_.isNull(userRole)) {
    return respondNotFound(`role_user with id ${id} not found`);
  }

  await AclUserRole.destroy({
    where: {
      id,
    },
  });
  await require('@service/acl/Roles').getRoles();
  return respondSuccess('role of user, deleted');
};
