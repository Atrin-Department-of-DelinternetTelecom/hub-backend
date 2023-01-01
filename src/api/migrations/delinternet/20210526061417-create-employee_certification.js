'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_employee_certification', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      institute: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      granted_on: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      valid_until: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      certification: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      proof_doc_file_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      employee_id: {
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
    return queryInterface.dropTable('hrms_employee_certification');
  },
};
