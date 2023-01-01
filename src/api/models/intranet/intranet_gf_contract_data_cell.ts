import { AnyModel, DatabaseModels } from '@models';
import {
  CELL_ACTUAL_MODALITY,
  CELL_PAYMENT_METHOD,
  CELL_SIM_TYPE,
} from '@api/constants/contracts';
import { DataTypes, Model, Op, Sequelize, VIRTUAL } from 'sequelize';
import { Line, RequestLine } from '@delinternet/sdk-aire';

import { GfAireContract } from './intranet_gf_aire_contracts';
import { LemonLine } from './intranet_lemon_line';
import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';
import { firstPopulated } from '@api/utils/helpers';
import moment from 'moment';

const cellFees = async (): Promise<AnyModel[]> => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GfCellProvider } = require('@models').intranet;
  return GfCellProvider.scope('defaultScope', 'aire').findAll({
    attributes: ['id'],
  });
};

const splitInLastChr = (s: string) => [
  s.substring(0, s.length - 1),
  s.substring(s.length - 1),
];

export class GfContractDataCell extends Model {
  declare id: number;
  declare uid: number;
  declare portability: number;
  declare number: string | null;
  declare icc: string | null;
  declare iccControlDigit: string | null;
  declare iccPlusControlDigit: string | null;
  declare actualModality: CELL_ACTUAL_MODALITY;
  declare origenIcc: string | null;
  declare origenControlDigit: string | null;
  declare origenIccPlusControlDigit: string | null;
  declare providerReserveCode: string | null;
  declare providerRequestCode: string | null;
  declare lastGetStateText: string | null;
  declare contractId: number;
  declare document: string | null;
  declare portabilityDoc: string | null;
  declare extraDoc: string | null;
  declare simPaymentMethod: CELL_PAYMENT_METHOD;
  declare simType: CELL_SIM_TYPE;
  declare email: string | null;
  declare lastRevision: Date | null;
  declare linkedAireId: number | null;
  declare ventanaDeCambio: string | null;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  declare request: Record<string, unknown>;
  // realtions
  declare AireRequest?: AnyModel;
  declare LemonLine?: LemonLine;
  declare GfAireContract?: GfAireContract;
  declare contract?: AnyModel;
  declare bonuses?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfContractDataCell.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractDataCell.hasOne(models.AireRequest, {
      sourceKey: 'providerRequestCode',
      foreignKey: 'code',
    });
    GfContractDataCell.belongsToMany(models.GfCellProviderFeeBonus, {
      through: {
        model: models.GfContractDataCellInitialBonusXref,
        scope: defaultScope.where,
      },
      foreignKey: 'dataCellId',
      otherKey: 'aireBonoId',
      as: 'bonuses',
    });
    GfContractDataCell.hasOne(models.GfAireContract, {
      sourceKey: 'contractId',
      foreignKey: 'linkedContractId',
    });
    GfContractDataCell.hasOne(models.LemonLine, {
      sourceKey: 'contractId',
      foreignKey: 'gf_contract_id',
    });
  }

  static async selectContractAireFromClientAndNumber(
    clientId: number,
    number: string,
  ) {
    const { GfContract, GfFee, GfContractDataCell } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@models').intranet;

    return GfContract.findAll({
      where: { clientId },
      include: [
        {
          model: GfContractDataCell,
          as: 'dataCell',
          left: true,
          where: { number },
        },
        {
          model: GfFee,
          as: 'fees',
          left: true,
          where: {
            [Op.or]: [
              { cellProviderId: (await cellFees()).map((fee) => fee.id) },
              { cellProviderId: null },
            ],
          },
        },
      ],
    });
  }

  static async forClient(clientId: number, trashed = false) {
    const { GfContract, GfFee, GfContractDataCell } =
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('@models').intranet;

    return GfContract.findAll({
      where: { clientId, status: trashed ? 0 : 1 },
      include: [
        {
          model: GfContractDataCell,
          as: 'dataCell',
          left: true,
        },
        {
          model: GfFee,
          as: 'fees',
          left: true,
          where: {
            [Op.or]: [
              {
                cellProviderId: (await cellFees()).map((fee) => fee.id),
              },
              { cellProviderId: null },
            ],
          },
        },
      ],
    });
  }

  static async getDeleted(number: string, clientId: number) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GfContract, GfContractDataCell } = require('@models').intranet;
    return GfContract.findOne({
      where: {
        status: 0,
        clientId: clientId,
        updateDate: {
          [Op.gt]: moment().add(-2, 'days').format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      include: [
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: true,
        },
      ],
    });
  }

  async fillFromLineRequest(line: Line, requestLine: RequestLine) {
    return this.set({
      providerRequestCode: firstPopulated([
        requestLine.cod,
        this.providerRequestCode,
        null,
      ]),
      actualModality: firstPopulated([
        requestLine.modalidad_actual,
        this.actualModality,
        null,
      ]),
      icc: firstPopulated(
        [line.sims?.[0]?.icc, requestLine.icc, this.icc],
        null,
      ),
      iccControlDigit: firstPopulated(
        [line.sims?.[0].dc, requestLine.icc_dc, this.iccControlDigit],
        null,
      ),
    });
  }

  static async findByContractId(contractId: number) {
    return GfContractDataCell.findOne({ where: { contractId } });
  }

  toSearchableObject() {
    return {
      number: this.number,
      icc: this.iccPlusControlDigit,
      email: this.email,
      origenIcc: this.origenIccPlusControlDigit,
      providerReserveCode: this.providerReserveCode,
      providerRequestCode: this.providerRequestCode,
      linkedAireId: this.number,
    };
  }
}

export function init(sequelize: Sequelize) {
  GfContractDataCell.init(
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
      portability: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      icc: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      iccControlDigit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      iccPlusControlDigit: {
        allowNull: true,
        type: VIRTUAL,
        set(value) {
          const [icc, iccControlDigit] = splitInLastChr(
            (value as string) ?? '',
          );
          this.setDataValue('icc', icc ?? null);
          this.setDataValue('iccControlDigit', iccControlDigit ?? null);
        },
        get() {
          return [this.icc, this.iccControlDigit].join('') || null;
        },
      },
      actualModality: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      origenIcc: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      origenControlDigit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      origenIccPlusControlDigit: {
        allowNull: true,
        type: VIRTUAL,
        set(value) {
          const [origenIcc, origenControlDigit] = splitInLastChr(
            value as string,
          );
          this.setDataValue('origenIcc', origenIcc);
          this.setDataValue('origenControlDigit', origenControlDigit);
        },
        get() {
          return [this.origenIcc, this.origenControlDigit].join('') || null;
        },
      },
      request: {
        allowNull: true,
        type: VIRTUAL,
        set() {},
        get() {
          return this.AireRequest?.prepareRequestDetail() ?? {};
        },
      },
      providerReserveCode: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      providerRequestCode: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      lastGetStateText: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      document: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      portabilityDoc: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      extraDoc: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      simPaymentMethod: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      simType: {
        type: DataTypes.ENUM(...Object.values(CELL_SIM_TYPE)),
        allowNull: true,
        defaultValue: CELL_SIM_TYPE.PHYSICAL,
      },
      lastRevision: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      linkedAireId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      ventanaDeCambio: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
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
    },
    {
      sequelize,
      tableName: 'gf_contract_data_cell',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope,
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

  return GfContractDataCell;
}
