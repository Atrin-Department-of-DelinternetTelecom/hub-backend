'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_employee_basic_information', {
      id: {
        autoIncrement: true,
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
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
      employee_number: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      birth_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM('male', 'female', 'other'),
        allowNull: false,
      },
      marital_status: {
        type: Sequelize.ENUM(
          'single',
          'married',
          'divorced',
          'widowed',
          'other',
        ),
        allowNull: false,
      },
      immigration_status: {
        type: Sequelize.ENUM(
          'citizen',
          'permanent resident',
          'work permit holder',
          'depandant pass holder',
        ),
        allowNull: false,
      },
      ssn_nric: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      nic: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      other_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      driving_license_no: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      employment_status_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'hrms_employment_status',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      department_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'hrms_department',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      job_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
        references: {
          model: 'hrms_job',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      pay_grade: {
        type: Sequelize.ENUM(
          'manager',
          'executive',
          'assistant',
          'administrator',
        ),
        allowNull: false,
      },
      joined_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      confirmation_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      termination_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      work_station_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: true,
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
    return queryInterface.dropTable('hrms_employee_basic_information');
  },
};
