'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Section extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Section.hasMany(models.Fee, { foreignKey: 'section_id', as: 'fees' });
      Section.belongsTo(models.Definition, {
        foreignKey: 'definition_id',
        as: 'definition',
      });
      Section.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
      Section.hasMany(models.Text, {
        foreignKey: 'locator_id',
        scope: {
          locator_type: 'section',
        },
        as: 'texts',
      });
    }
  }
  Section.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      alias: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      weight: {
        allowNull: false,
        type: DataTypes.INTEGER,
      },
      definition_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      discount: {
        allowNull: false,
        type: DataTypes.DECIMAL(11, 2),
      },
      discount_type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      tax: {
        allowNull: false,
        type: DataTypes.DECIMAL(11, 2),
      },
      tax_type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      discount_permanent: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
      },
      icon: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'Section',
      tableName: 'web_sections',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return Section;
};
