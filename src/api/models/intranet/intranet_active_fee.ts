import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import _ from 'lodash';
import { get as config } from '@config';
import intranet from '@utils/intranet';

export class GfActiveFee extends Model {
  declare id: number;
  declare uid: number;
  declare name: string;
  declare fromDate: string;
  declare feeGroupId: number;
  declare classBuilder: string;
  declare cellProviderId: number;
  declare cellFee: number;
  declare cellPercentage: number;
  declare cellExcludeFromAire: number;
  declare internetIncludedMb: number;
  declare internetIncludedUpMb: number;
  declare internetDefaultCpeLineProfile: string;
  declare internetSLAType: string;
  declare internetTechnology: string;
  declare internetExcludeFromRadius: number;
  declare internetTax: number;
  declare internetTechnologyAnalitic: string;
  declare internetPercentageRule: string;
  declare internetCapexType: number;
  declare internetOpexValue: number;
  declare internetInfraIp: number;
  declare internetTransit: number;
  declare internetSuportCor: number;
  declare internetRadiusGroupName: string;
  declare internetSLAE: string;
  declare fixConcurrentCalls: number;
  declare fixCallForwarded: boolean;
  declare initialCost: number;
  declare baseQuote: number;
  declare tpvCode: string;
  declare initialCostTpvCode: string;
  declare status: number;
  declare creationDate: string;
  declare updateDate: string;
  declare ivozId: number;
  declare description: string;
  declare extraData: string;

  declare feeGroup?: AnyModel;
  declare cellProviders?: AnyModel;

  static associate(models: DatabaseModels) {
    GfActiveFee.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'fee_group',
    });
    GfActiveFee.belongsTo(models.GfCellProvider, {
      foreignKey: 'cellProviderId',
      as: 'cellProvider',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfActiveFee.init(
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extraData: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fromDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      feeGroupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      classBuilder: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      cellProviderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cellFee: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      cellPercentage: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      cellExcludeFromAire: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetIncludedMb: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetIncludedUpMb: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetDefaultCpeLineProfile: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      internetSLAType: {
        type: DataTypes.ENUM('8x5-8h', '8x5-16h', '24x7-8h'),
        allowNull: true,
      },
      internetTechnology: {
        type: DataTypes.ENUM(
          'altres',
          'fibra',
          'radio',
          'adsl',
          '4g',
          'no_nostre',
        ),
        allowNull: true,
      },
      internetExcludeFromRadius: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetTax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      internetTechnologyAnalitic: {
        type: DataTypes.ENUM(
          'ADSL',
          'BONOSRAROS',
          'RADIO',
          'FIXBONUS',
          'FIBRA',
          'FIBRAINTERNET',
        ),
        allowNull: true,
      },
      internetPercentageRule: {
        type: DataTypes.ENUM('INTERNET', 'INTERNET+BONO'),
        allowNull: true,
      },
      internetCapexType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      internetOpexValue: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      internetInfraIp: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      internetTransit: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      internetSuportCor: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        defaultValue: 0.0,
      },
      internetRadiusGroupName: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      internetSLAE: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      fixConcurrentCalls: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      fixCallForwarded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      initialCost: {
        type: DataTypes.DECIMAL(11, 4),
        allowNull: true,
        defaultValue: 0.0,
      },
      baseQuote: {
        type: DataTypes.DECIMAL(11, 4),
        allowNull: true,
      },
      tpvCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      initialCostTpvCode: {
        type: DataTypes.STRING(255),
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
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ivozId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      description: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
        get() {
          return this.feeGroup?.name ?? null;
        },
        set() {},
      },
    },
    {
      sequelize,
      modelName: 'GfActiveFee',
      tableName: 'active_gf_fees_view',
      schema: 'intranet',
      timestamps: false,
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );

  return GfActiveFee;
}
