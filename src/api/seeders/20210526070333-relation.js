'use strict';

const SEquelize = require('sequelize');
const { User, AclApp, AclMenu } = require('@models').system;
const relations = [];

relations.push({
  acl_app_id: null,
  acl_menu_id: null,
  acl_action_id: null,
  creator_id: 1,
  created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
  updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
});

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const apps = await AclApp.findAll();
    for (const app of apps) {
      relations.push({
        acl_app_id: app.id,
        acl_menu_id: null,
        acl_action_id: null,
        creator_id: 1,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      });
      const menus = await AclMenu.findAll({
        where: {
          acl_app_id: app.id,
        },
      });
      menus.forEach((menu) => {
        relations.push({
          acl_app_id: app.id,
          acl_menu_id: menu.id,
          acl_action_id: null,
          creator_id: 1,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        });
      });
    }
    await queryInterface.bulkInsert('acl_relations', relations, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('acl_relations', null, {});
  },
};
