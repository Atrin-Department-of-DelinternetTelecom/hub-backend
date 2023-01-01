'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('global_documents', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      creator_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'global_users',
          key: 'id',
        },
      },
      render_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        default: null,
      },
      signed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: false,
      },
      signature_upload_date: {
        type: Sequelize.DATE,
        allowNull: true,
        default: null,
      },
      base_data_complete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        default: false,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        default: null,
      },
      type: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('global_documents');
  },
};
