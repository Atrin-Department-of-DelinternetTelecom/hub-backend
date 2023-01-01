'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_payroll', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      salary: {
        type: Sequelize.DOUBLE(8, 2),
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
      company_signature_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      pdf_image_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      template_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
      },
      employee_signature_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      employee_signature_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      company_signature_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      payment_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'readyToPay', 'paid', 'cancel'),
        defaultValue: 'pending',
        allowNull: false,
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      reject_payment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
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
    return queryInterface.dropTable('hrms_payroll');
  },
};
