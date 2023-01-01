'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Text extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Text.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
      Text.belongsTo(models.Definition, {
        foreignKey: 'locator_id',
        constraints: false,
      });
      Text.belongsTo(models.Section, {
        foreignKey: 'locator_id',
        constraints: false,
      });
      Text.belongsTo(models.Fee, {
        foreignKey: 'locator_id',
        constraints: false,
      });
      Text.addHook('afterFind', (findResult) => {
        if (!Array.isArray(findResult)) {
          findResult = [findResult];
        }
        for (const instance of findResult) {
          if (
            instance !== null &&
            instance.locator_type === 'definition' &&
            instance.Definition !== undefined
          ) {
            delete instance.Section;
            delete instance.dataValues.Section;
            delete instance.Fee;
            delete instance.dataValues.Fee;
          } else if (
            instance !== null &&
            instance.locator_type === 'section' &&
            instance.Section !== undefined
          ) {
            delete instance.Definition;
            delete instance.dataValues.Definition;
            delete instance.Fee;
            delete instance.dataValues.Fee;
          } else if (
            instance !== null &&
            instance.locator_type === 'fee' &&
            instance.Fee !== undefined
          ) {
            delete instance.Definition;
            delete instance.dataValues.Definition;
            delete instance.Section;
            delete instance.dataValues.Section;
          }
        }
      });
    }
  }

  Text.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      locator: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      locator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      text: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      language: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      locator_type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      weight: {
        allowNull: false,
        type: DataTypes.INTEGER,
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
      modelName: 'Text',
      tableName: 'web_texts',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return Text;
};
