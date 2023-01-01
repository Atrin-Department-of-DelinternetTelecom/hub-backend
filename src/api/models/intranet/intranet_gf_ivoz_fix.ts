import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';

import { IVOZ_STATE } from '@api/constants/contracts';
import { get as config } from '@config';
import intranet from '@utils/intranet';

export class GfIvozFix extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare extension: number | null;
  declare password: string | null;
  declare email: string | null;
  declare giverOperator: string | null;
  declare useAta: number;
  declare sync: number;
  declare nif: string | null;
  declare language: string | null;
  declare ring_time: number;
  declare type: string | null;
  declare maxInboundCalls: number;
  declare maxCalls: number;
  declare cf: number;
  declare cfb: number;
  declare cfu: number;
  declare voicemail: number;
  declare description: string | null;
  declare error: string | null;
  declare autoExecuteDate: string | null;
  declare state: IVOZ_STATE;
  declare ratingGroup: number;
  declare status: number;
  declare creationDate: string;
  declare updateDate: string;
  // relationships
  declare contract?: AnyModel;
  declare operator?: AnyModel;

  static associate(models: DatabaseModels) {
    GfIvozFix.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfIvozFix.belongsTo(models.GfUser, {
      foreignKey: 'giverOperator',
      targetKey: 'userId',
      as: 'operator',
    });
  }

  async setCorrectState() {
    const ivozFix = await GfIvozFix.findOne({
      where: { contractId: this.contractId },
    });

    if (!ivozFix && (this.state === IVOZ_STATE.PENDING || !this.state)) {
      this.setDataValue('state', IVOZ_STATE.PREPARING);
    }

    if (this.isNewRecord || ivozFix?.toJSON() !== this.toJSON()) {
      this.setDataValue('sync', 0);
    }
  }

  ensureOfPassword() {
    if (!this.password) {
      this.setDataValue('password', this.generatePassword());
    }

    return this;
  }

  generatePassword() {
    const numbers = '0123456789';
    const lowercases = 'abcdefghijklmnopqrstuvwxyz';
    const upperCases = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const unknowns = '+*_-';
    const arrays: string[][] = [];

    arrays.push(this.getRandom(numbers, 3));
    arrays.push(this.getRandom(lowercases, 3));
    arrays.push(this.getRandom(upperCases, 3));
    arrays.push(this.getRandom(unknowns, 1));

    return this.shuffleRandom(arrays).join('');
  }

  shuffleRandom(arrays: string[][]) {
    const final = [];
    for (let i = 0; i < 10; i++) {
      const random_arr = Math.floor(Math.random() * arrays.length);
      if (arrays.length >= random_arr) {
        const selected_arr = arrays[random_arr];
        const random_index = Math.floor(Math.random() * selected_arr.length);
        final.push(selected_arr[random_index]);
        selected_arr.splice(random_index, 1);
        if (selected_arr.length == 0) {
          arrays.splice(random_arr, 1);
        }
      }
    }
    return final;
  }

  getRandom(str: string, number: number) {
    const result = [];
    for (let i = 0; i < number; i++) {
      result.push(str.charAt(Math.floor(Math.random() * str.length)));
    }
    return result;
  }

  static findByContractId(contractId: number) {
    return GfIvozFix.findOne({ where: { contractId } });
  }
}

export function init(sequelize: Sequelize) {
  GfIvozFix.init(
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
      extension: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      giverOperator: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      useAta: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      sync: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      nif: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      language: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ring_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      maxInboundCalls: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      maxCalls: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      cf: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      cfb: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      cfu: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      voicemail: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '',
      },
      autoExecuteDate: {
        type: DataTypes.DATE,
        allowNull: true,
        set(value) {
          this.setDataValue('autoExecuteDate', value ? value : null);
        },
      },
      state: {
        type: DataTypes.ENUM,
        values: Object.values(IVOZ_STATE),
        allowNull: false,
        defaultValue: IVOZ_STATE.PENDING,
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
      ratingGroup: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      tableName: 'gf_ivoz_fix',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: { ...intranet.defaultScope },

      hooks: {
        async beforeSave(model) {
          await model.ensureOfPassword().setCorrectState();
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

  return GfIvozFix;
}
