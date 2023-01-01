'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, { DataTypes }) => {
    await queryInterface.createTable('aire_upload_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      document_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
        comment: 'The id of the "global_document_id" or "the gf_doc_id" tables',
      },
      user_id: {
        allowNull: false,
        type: DataTypes.INTEGER.UNSIGNED,
        comment: 'Holds "user_id" of the "global_users" table',
      },
      success: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'The result state of the uploading',
      },
      error: {
        allowNull: true,
        type: DataTypes.STRING,
        defaultValue: null,
        comment: 'The error message of a failed upload',
      },
      uploaded_at: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.KNOW,
        comment: 'Date of uploading to provider',
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('aire_upload_histories');
  },
};
