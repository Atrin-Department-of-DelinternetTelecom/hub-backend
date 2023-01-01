import { AnyModel, DatabaseModels } from '..';
import { Bono, Line } from '@delinternet/sdk-aire';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';

import config from '@config';
import intranet from '@utils/intranet';
import { unserialize } from 'locutus/php/var';

export class GfAireContract extends Model {
  declare id: number;
  declare active: 0 | 1;
  declare aireData: string | null;
  declare number: string;
  declare id_linea: string;
  declare linkedContractId: number | null;
  declare siglas: string | null;
  declare new: number | null;
  declare line?: Line | null;
  declare GfContractDataCell: AnyModel;
  private _deserializedAireLine: Line | null = null;

  isActive() {
    return Boolean(this.active);
  }

  static async swap(control: any) {
    await GfAireContract.destroy({
      where: {
        [Op.or]: [
          {
            new: {
              [Op.not]: control,
            },
          },
          { new: null },
        ],
      },
    });

    await GfAireContract.update(
      {
        new: 0,
      },
      {
        where: {},
      },
    );
  }

  static clearLinks() {
    return this.update(
      { linkedContractId: null },
      {
        where: {},
      },
    );
  }

  getAireData(): Line | null {
    if (this._deserializedAireLine === null && this.aireData) {
      this._deserializedAireLine = unserialize(this.aireData);
    }
    return this._deserializedAireLine;
  }

  bonuses(): Bono[] {
    const bonuses = this.getAireData()?.bonos;

    return Array.isArray(bonuses)
      ? bonuses.map((bono) => ({ ...bono, cod: bono.id }))
      : [];
  }

  static selectWidowers = async (filter: any) => {
    return GfAireContract.findAll({
      where: {
        linkedContractId: [null, 0],
        new: 0,
        ...filter,
      },
    });
  };

  static associate(allModels: DatabaseModels) {
    GfAireContract.hasOne(allModels.GfContractDataCell, {
      foreignKey: 'linkedAireId',
    });
    GfAireContract.belongsTo(allModels.GfContract, {
      foreignKey: 'linkedContractId',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfAireContract.init(
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
      number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      id_linea: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      aireData: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      linkedContractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      siglas: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      new: {
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
    },
    {
      sequelize,
      tableName: 'gf_aire_contracts',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      scopes: {
        active: {
          where: {
            active: 1,
          },
        },
        new: {
          where: {
            new: 1,
          },
        },
        old: {
          where: {
            new: 0,
          },
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

  return GfAireContract;
}
