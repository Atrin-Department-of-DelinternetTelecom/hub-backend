import { DataTypes, Model, Sequelize } from 'sequelize';
import { ProductData, USAGE_STATUS, UsageData } from '@del-internet/lemon';

import { DatabaseModels } from '@models';
import { LEMON_STATUS } from '@api/constants/statuses';
import { get as config } from '@config';

export class LemonLine extends Model {
  declare id: number;
  declare number: string;
  declare fiscal_id: string;
  declare gf_contract_id: number;
  declare active: boolean;
  declare portable: boolean;
  declare creation_date: string;
  declare termination_date: string;
  declare data: UsageData;
  declare package: ProductData;
  declare created_at: Date;
  declare updated_at: Date;

  _deserializedData?: UsageData;
  _deserializedProduct?: ProductData;

  static associate(models: DatabaseModels) {
    LemonLine.belongsTo(models.GfContract);
  }

  isActive() {
    return !!this.active;
  }

  isPending() {
    return this.data.status === USAGE_STATUS.PENDING;
  }

  isBlocked() {
    return this.data.status === USAGE_STATUS.BLOCKED;
  }

  get packageId() {
    return this.package.packageId;
  }

  bonuses() {
    return this.availableBonuses().filter((bonus) => {
      return LemonLine.bonusPackages().includes(bonus.packageId);
    });
  }

  private availableBonuses() {
    return [
      ...(this.data.Promo?.Detalle ?? []),
      ...(this.data.VozInternacional?.Detalle ?? []).map((bonus) => {
        return { ...bonus, packageId: bonus.Nombre };
      }),
    ];
  }

  static bonusPackages() {
    return [
      'BONO_ADICIONAL_1GB_NO_RENOVABLE',
      'BONO_ADICIONAL_3GB_NO_RENOVABLE',
      'BONO_ADICIONAL_5GB_NO_RENOVABLE',
      'Internacional_EUROPAFREE100min',
      'Internacional_EUROPAFREE300min',
      'Bono_Roaming1_Giga',
      'Bono_Roaming3_Giga',
      'Bono_Roaming5_Giga',
      'BonoRoaming_Zona2',
      'BonoRoaming_Zona3',
      'changeMsisdnLemonvil',
      'changeSimLemonvil',
    ];
  }
}

export function init(sequelize: Sequelize) {
  LemonLine.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      fiscal_id: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      gf_contract_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      portable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      creation_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      termination_date: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      package: {
        type: DataTypes.TEXT,
        allowNull: false,
        set(value) {
          this.setDataValue(
            'package',
            typeof value === 'string' ? value : JSON.stringify(value),
          );
        },
        get() {
          if (!this._deserializedProduct) {
            this._deserializedProduct = JSON.parse(
              this.getDataValue('package') ?? '[]',
            );
          }

          return this._deserializedProduct!;
        },
      },
      data: {
        type: DataTypes.TEXT,
        allowNull: false,
        set(value) {
          this.setDataValue(
            'data',
            typeof value === 'string' ? value : JSON.stringify(value),
          );
        },
        get() {
          if (!this._deserializedData) {
            this._deserializedData = JSON.parse(
              this.getDataValue('data') ?? '[]',
            );
          }

          return this._deserializedData!;
        },
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'lemon_lines',
      schema: config('index.sequelize.intranet.database'),
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

  return LemonLine;
}
