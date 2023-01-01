'use strict';

// const {app_json} = require('@config')
// const appNames = Object.keys(require(app_json))

// const {
//     AclApp,
//     AclMenu
// } = require('@models').allModels;
// const actions = [];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // const apps = await AclApp.findAll();
    // const menus = await AclMenu.findAll()
    // apps.forEach(app => {
    //     menus.forEach(menu => {
    //         if (menu.acl_app_id === app.id) {
    //             const actionsNames = Object.keys(appNames[app.name][menu.name].actions);
    //             actionsNames.forEach(actionsName => {
    //                 actions.push({
    //                     name: actionsName,
    //                     api_method: appNames[app.name][menu.name].actions[actionsName].api_method,
    //                     api_path: appNames[app.name][menu.name].actions[actionsName].api_path,
    //                     acl_menu_id: menu.id,
    //                     created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
    //                     updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    //                 })
    //             });
    //         }
    //     });
    // })
    //await queryInterface.bulkInsert('acl_actions', actions, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('acl_actions', null, {});
  },
};
