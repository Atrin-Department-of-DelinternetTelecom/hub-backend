'use strict';
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
const { Mixin } = require('@lib/media');
const { Op, where, fn, col } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const GfIncidence = sequelize.define(
    'GfIncidence',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      executedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      file1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      file6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubFile6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sectionCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      motherEventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'GfIncidence',
      tableName: 'gf_incidences',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      hooks: {
        afterSave: async (incidence, { transaction }) => {
          if (transaction) {
            transaction.afterCommit(async () => {
              await moveEditorMedias(incidence);
            });
          } else {
            await moveEditorMedias(incidence);
          }
        },
      },
    },
  );

  GfIncidence.associate = (models) => {
    GfIncidence.belongsTo(models.GfClient, {
      as: 'client',
      foreignKey: 'clientId',
    });
    GfIncidence.belongsTo(models.GfContract, {
      as: 'contract',
      foreignKey: 'contractId',
    });
    GfIncidence.belongsTo(models.CrTask, {
      as: 'mother_event',
      foreignKey: 'motherEventId',
    });
    GfIncidence.hasMany(models.GfAssist, {
      as: 'assists',
      foreignKey: 'incidenceId',
    });

    GfIncidence.belongsTo(models.User, {
      as: 'creator',
      foreignKey: 'userId',
      targetKey: 'userId',
    });
  };

  GfIncidence.searchCreatorName = async (value) => {
    const likeString = `%${value.replace(/%/g, '')}%`;
    return {
      key: Op.and,
      where: where(fn('concat', col('first_name'), col('last_name')), {
        [Op.like]: likeString,
      }),
    };
  };

  const moveEditorMedias = async (incidence) => {
    const matches =
      String(incidence.description).match(
        /data-media\s*=\s*['"`]?(\d+)['"`]?/g,
      ) ?? [];

    if (matches.length === 0) {
      return;
    }

    const { GlobalMedia } = require('@models').system;

    const medias = await GlobalMedia.findAll({
      where: {
        model_id: null,
        id: matches.map((match) => Number(match.match(/\d+/)[0])),
      },
    });

    await Promise.all(
      medias.map((media) => media.updateForResource(incidence)),
    );
  };

  // handle media library
  Mixin.applyTo(GfIncidence);
  // @ts-ignore
  GfIncidence.addCollection('editor', (collection) => {
    collection.useDisk('incidence');
  });

  return GfIncidence;
};
