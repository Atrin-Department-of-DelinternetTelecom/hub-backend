'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_vacation', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'global_users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      from: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      to: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      template_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      state: {
        type: Sequelize.ENUM(
          'pending',
          'approve',
          'cancel',
          'started',
          'finish',
        ),
        defaultValue: 'pending',
        allowNull: false,
      },
      explain: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      state_by_owner: {
        type: Sequelize.TINYINT(1),
        allowNull: false,
        defaultValue: '0',
      },
      signature_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      html_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      sign_doc_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      sign_doc_image_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      creator_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: {
          model: 'global_users',
          key: 'id',
        },
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
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
    return queryInterface.dropTable('hrms_vacation');
  },
};
