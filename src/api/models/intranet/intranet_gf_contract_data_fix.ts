import { AnyModel, DatabaseModels } from '@models';
import { DATA_FIX_TYPE, IVOZ_TYPE } from '@api/constants/contracts';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import assert from 'assert';
import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfContractDataFix extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare internetSectionId: number | null;
  declare directIp: string | null;
  declare type: DATA_FIX_TYPE;
  declare idTpv: string | null;
  declare trustedId: number | null;
  declare trustedDescription: string | null;
  declare portability: number;
  declare potId: string | null;
  declare number: string | null;
  declare nat: number | null;
  declare giverOperator: string | null;
  declare technician_id: number | null;
  declare kamailioDone: number;
  declare extension: string | null;
  declare password: string | null;
  declare description: string | null;
  declare autoExecuteDate: Date | null;
  declare aireExecuteDate: Date | null;
  declare airePortaId: string | null;
  declare aireStatus: string | null;
  declare invoiced: number | null;
  declare haveTeleassistance: number | null;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // realtions
  declare contract?: AnyModel;
  declare internetSection?: AnyModel;
  declare dataInternet?: AnyModel;
  declare section_status?: AnyModel;
  declare operator?: AnyModel;
  declare technician?: AnyModel;
  declare GfIvozFix?: AnyModel;

  static associate(models: DatabaseModels) {
    GfContractDataFix.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractDataFix.belongsTo(models.GfContract, {
      foreignKey: 'internetSectionId',
      as: 'internetSection',
    });
    GfContractDataFix.hasOne(models.GfContractDataInternet, {
      foreignKey: 'contractId',
      sourceKey: 'internetSectionId',
      as: 'dataInternet',
    });
    GfContractDataFix.hasOne(models.GfContractSectionStatus, {
      foreignKey: 'contractId',
      //@ts-ignore
      targetKey: 'contractId',
      as: 'section_status',
    });
    GfContractDataFix.belongsTo(models.GfUser, {
      foreignKey: 'giverOperator',
      targetKey: 'userId',
      as: 'operator',
    });
    GfContractDataFix.belongsTo(models.GfUser, {
      foreignKey: 'technician_id',
      targetKey: 'userId',
      as: 'technician',
    });
    GfContractDataFix.hasOne(models.GfIvozFix, {
      foreignKey: 'contractId',
      sourceKey: 'contractId',
    });
  }

  static findByContractId(contractId: number) {
    return GfContractDataFix.findOne({ where: { contractId } });
  }

  isParticular() {
    return this.type === DATA_FIX_TYPE.PARTICULAR;
  }

  isPortable() {
    return !!this.portability;
  }

  toSearchableObject() {
    return {
      number: this.number,
    };
  }
}

export function init(sequelize: Sequelize) {
  GfContractDataFix.init(
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
        defaultValue: config('index.intranet.uid'),
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetSectionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      directIp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      type: {
        type: DataTypes.ENUM,
        values: Object.values(DATA_FIX_TYPE),
      },
      idTpv: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      trustedId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      trustedDescription: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      portability: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      potId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      technician_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      nat: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      giverOperator: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      kamailioDone: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      extension: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      autoExecuteDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      aireExecuteDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      airePortaId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      aireStatus: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      invoiced: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      haveTeleassistance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      state: {
        type: DataTypes.VIRTUAL,
        get() {
          // should be implemented from FixFacade
          return 'step1';
        },
        set(value) {
          // throw new Error('Do not try to set the `fullName` value!');
        },
      },
    },
    {
      sequelize,
      tableName: 'gf_contract_data_fix',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      hooks: {
        afterCreate: async (model) => {
          const { GfIvozFix, GfClient, GfContract } = model.sequelize.models;
          const contract: AnyModel | null = await GfContract.findByPk(
            model.contractId,
            {
              include: [
                {
                  model: GfClient,
                  as: 'client',
                },
              ],
            },
          );
          assert(contract, `Contract by id ${model.contractId} not found`);

          await GfIvozFix.create({
            giverOperator: contract.sellerId,
            email: contract.client?.emailAddress,
            extension: model.number,
            maxInboundCalls: 2,
            maxCalls: 2,
            ratingGroup: 7,
            ring_time: 60,
            language: 'ca',
            autoExecuteDate: model.autoExecuteDate,
            description: null,
            contractId: model.contractId,
            type:
              model.type === DATA_FIX_TYPE.COMPANY
                ? IVOZ_TYPE.RESIDENTIAL
                : IVOZ_TYPE.HOME,
          });
        },
        afterSave: async (model) => {
          const { GfIvozFix } = model.sequelize.models;
          const ivoz: AnyModel | null = await GfIvozFix.findOne({
            where: { contractId: model.contractId },
          });

          if (ivoz === null || ivoz.extension == model.number) return;

          await GfIvozFix.update(
            { extension: model.number },
            { where: { contractId: model.contractId } },
          );
        },
      },
      defaultScope,
      scopes: {
        contract(contractId) {
          return {
            where: {
              contractId: contractId,
              state: {
                [Op.not]: 'suspended',
              },
            },
          };
        },
      },

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
  return GfContractDataFix;
}
