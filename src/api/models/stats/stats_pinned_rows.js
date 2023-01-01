'use strict';

const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const PinnedRow = sequelize.define(
    'PinnedRow',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      // the name of ui table that needs pinning feature. it's not a polymorphism column
      table_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      // id of row that should be pinned
      row_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'stats_pinned_rows',
      timestamps: true,
      underscored: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );

  return PinnedRow;
};
