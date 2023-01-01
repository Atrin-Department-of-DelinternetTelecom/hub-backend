'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_registration_comments');
    await queryInterface.dropTable('client_registrations');
    await queryInterface.createTable('client_agreements', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      contract_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
      },
      permanence_fine: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
      },
      end_of_permanence: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      number_of_payments: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      payment_value: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false,
      },
      status: {
        allowNull: true,
        type: Sequelize.ENUM('pending', 'checked'),
        defaultValue: 'pending',
      },
      doc_id: { allowNull: false, type: Sequelize.BIGINT.UNSIGNED },
      creator_id: {
        allowNull: false,
        type: Sequelize.BIGINT.UNSIGNED,
      },
      reviewer_id: {
        allowNull: true,
        type: Sequelize.BIGINT.UNSIGNED,
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
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_agreements');
  },
};
