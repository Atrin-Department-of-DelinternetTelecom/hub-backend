'use strict';

const { AclRole, AclRelation, AclApp, AclMenu, AclAction } =
  require('@models').system;
const _ = require('lodash');
const { Op } = require('sequelize');
const fs = require('fs');

const {
  getEventEmitter,
  SETTING_001_UPDATE_APP_JSON_ADD_APP,
  SETTING_002_UPDATE_APP_JSON_ADD_MENU,
  SETTING_003_DELETE_APP_JSON_ADD_APP,
  SETTING_004_DELETE_APP_JSON_ADD_MENU,
} = require('@lib/emitter');

exports.getRoles = async () => {
  const allRoles = await buldAppJson();
  const roleJson = {};
  const roleRecords = await AclRole.findAll({
    include: {
      model: AclRelation,
      through: {
        where: {
          deleted_at: {
            [Op.eq]: null,
          },
        },
      },
      as: 'roles',

      include: [
        {
          model: AclApp,
          as: 'app',
        },
        {
          model: AclMenu,
          as: 'menu',
        },
        {
          model: AclAction,
          as: 'action',
        },
      ],
    },
  });

  for (const roleName of roleRecords) {
    for (const roleRelation of roleName.roles) {
      if (!roleRelation.acl_app_id) {
        roleJson[roleName.name] = allRoles;
        break;
      }

      if (!roleRelation.acl_menu_id) {
        if (!roleJson[roleName.name]) {
          roleJson[roleName.name] = {};
        }
        roleJson[roleName.name][roleRelation.app.name] =
          allRoles[roleRelation.app.name];
        continue;
      }

      if (!roleRelation.acl_action_id) {
        if (!roleJson[roleName.name]) {
          roleJson[roleName.name] = {};
        }
        if (!roleJson[roleName.name][roleRelation.app.name]) {
          roleJson[roleName.name][roleRelation.app.name] = {};
        }

        roleJson[roleName.name][roleRelation.app.name][roleRelation.menu.name] =
          allRoles[roleRelation.app.name][roleRelation.menu.name];
        continue;
      }
      if (!roleJson[roleName.name]) {
        roleJson[roleName.name] = {};
      }
      if (!roleJson[roleName.name][roleRelation.app.name]) {
        roleJson[roleName.name][roleRelation.app.name] = {};
      }
      if (
        roleJson[roleName.name][roleRelation.app.name][roleRelation.menu.name]
      ) {
        roleJson[roleName.name][roleRelation.app.name][roleRelation.menu.name] =
          {};
        roleJson[roleName.name][roleRelation.app.name][
          roleRelation.menu.name
        ].actions = {};
      }
      roleJson[roleName.name][roleRelation.app.name][
        roleRelation.menu.name
      ].actions[roleRelation.action.name] =
        allRoles[roleRelation.app.name][roleRelation.menu.name].actions[
          roleRelation.action.name
        ];
    }
  }
  global.roles = roleJson;
  return roleJson;
};

getEventEmitter().on(
  SETTING_001_UPDATE_APP_JSON_ADD_APP,
  (app_name, app_id, creator_id) => {
    AddNewAppToPermission(app_name, app_id, creator_id);
  },
);

const AddNewAppToPermission = async (app_name, acl_app_id, creator_id) => {
  //create
  await AclRelation.create({
    acl_app_id,
    creator_id,
  });

  await exports.getRoles();
};

getEventEmitter().on(
  SETTING_002_UPDATE_APP_JSON_ADD_MENU,
  (app_name, app_id, menu_name, menu_id, creator_id) => {
    AddNewMENUToRelation(app_name, app_id, menu_name, menu_id, creator_id);
  },
);

const AddNewMENUToRelation = async (
  app_name,
  acl_app_id,
  menu_name,
  acl_menu_id,
  creator_id,
) => {
  await AclRelation.create({
    acl_app_id,
    acl_menu_id,
    creator_id,
  });

  await exports.getRoles();
};

getEventEmitter().on(
  SETTING_003_DELETE_APP_JSON_ADD_APP,
  (app_name, app_id) => {
    AfterDeleteApp(app_name, app_id);
  },
);

const AfterDeleteApp = async (app_name, acl_app_id) => {
  await AclRelation.destroy({
    where: {
      acl_app_id,
    },
  });

  await exports.getRoles();
};

getEventEmitter().on(
  SETTING_004_DELETE_APP_JSON_ADD_MENU,
  (app_name, app_id, menu_name, menu_id) => {
    AfterDeleteMenu(app_name, app_id, menu_name, menu_id);
  },
);

const AfterDeleteMenu = async (
  app_name,
  acl_app_id,
  menu_name,
  acl_menu_id,
) => {
  await AclRelation.destroy({
    where: {
      acl_app_id,
      acl_menu_id,
    },
  });

  await exports.getRoles();
};

const buldAppJson = async () => {
  const apps = await AclApp.findAll({
    include: { model: AclMenu, as: 'menu_items' },
  });
  const allRoles = {};
  for (const app of apps) {
    allRoles[app.name] = {};
    for (const menu of app.menu_items) {
      allRoles[app.name][menu.name] = { action: {} };
    }
  }
  return allRoles;
};
