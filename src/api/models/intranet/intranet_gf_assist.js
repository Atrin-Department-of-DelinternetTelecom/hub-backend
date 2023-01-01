'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
const { Mixin } = require('@lib/media');

module.exports = function (sequelize, DataTypes) {
  const GfAssist = sequelize.define(
    'GfAssist',
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
      agendation: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      assist: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      incidenceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gfUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdByUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      previsionDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      executedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      materialText: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      motherEventId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      signed: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubSigned: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lat: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      lng: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
      },
      willShipImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubWillShipImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      useWillShipImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage3: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage4: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage5: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage6: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      image7: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage7: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image8: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage8: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image9: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage9: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image10: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage10: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image11: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage11: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      image12: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      hubImage12: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      closed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      sectionCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      contactPhone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      // Do not use this field, it's only for backup purpose. this column can be removed anytime.
      malformedContactPhone: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      alias: {
        type: DataTypes.STRING(255),
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
      modelName: 'GfAssist',
      tableName: 'gf_assists',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },

      hooks: {
        afterSave: async (assistance, { transaction }) => {
          if (transaction) {
            transaction.afterCommit(async () => moveEditorMedias(assistance));
          } else {
            await moveEditorMedias(assistance);
          }
        },
      },
    },
  );

  GfAssist.associate = (models) => {
    GfAssist.belongsTo(models.GfIncidence, {
      foreignKey: 'incidenceId',
      as: 'incidence',
    });

    GfAssist.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });

    GfAssist.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });

    GfAssist.belongsTo(models.GfUser, {
      foreignKey: 'gfUserId',
      as: 'gfUser',
    });

    GfAssist.belongsTo(models.User, {
      foreignKey: 'gfUserId',
      targetKey: 'gf_user_id',
      as: 'global_gf_user',
    });
    GfAssist.belongsToMany(models.User, {
      as: 'coWorkers',
      through: 'gf_assist_co_workers',
      foreignKey: 'gf_assist_id',
      otherKey: 'user_id',
      timestamps: false,
    });

    GfAssist.belongsTo(models.User, {
      foreignKey: 'createdByUserId',
      targetKey: 'userId',
      as: 'system_user',
    });

    GfAssist.belongsTo(models.CrTask, {
      foreignKey: 'motherEventId',
      as: 'mother_event',
    });
  };

  const moveEditorMedias = async (assistance) => {
    const matches =
      String(assistance.description).match(
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
      medias.map((media) => media.updateForResource(assistance)),
    );
  };

  // handle media library
  Mixin.applyTo(GfAssist);
  // @ts-ignore
  GfAssist.addCollection('editor', (collection) => {
    collection.useDisk('assistance');
  });

  return GfAssist;
};
