'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('web_call_me', 'reference', {
      type: Sequelize.ENUM('WEB', 'CLUB', 'WEB_CHAT', 'VOICE_DESK'),
      allowNull: false,
      defaultValue: 'WEB',
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('web_call_me', 'reference', {
      type: Sequelize.ENUM('WEB', 'CLUB'),
      allowNull: false,
      defaultValue: 'WEB',
    });
  },
};
