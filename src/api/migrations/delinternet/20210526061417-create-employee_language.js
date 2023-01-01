'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('hrms_employee_language', {
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
      reading: {
        type: Sequelize.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: false,
      },
      listening: {
        type: Sequelize.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: false,
      },
      speaking: {
        type: Sequelize.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: false,
      },
      writing: {
        type: Sequelize.ENUM(
          'Elementry proficiency',
          'limited working proficiency',
          'professional working proficiency',
          'full professional proficiency',
          'native or bilingual proficiency',
        ),
        allowNull: false,
      },
      language: {
        type: Sequelize.STRING(255),
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
    return queryInterface.dropTable('hrms_employee_language');
  },
};
