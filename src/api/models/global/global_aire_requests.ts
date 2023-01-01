import { DataTypes, Model, Sequelize } from 'sequelize';
import { RequestLine, STATE } from '@delinternet/sdk-aire';

import { DatabaseModels } from '@models';
import { get as config } from '@config';

export class AireRequest extends Model {
  declare id: number;
  declare code: string;
  declare number: string;
  declare fiscal_id: string;
  declare request: string | null;
  private _deserializedRequestLine: RequestLine | null = null;

  getAireData(): RequestLine | null {
    if (this._deserializedRequestLine === null && this.request) {
      this._deserializedRequestLine = JSON.parse(this.request ?? '[]');
    }
    return this._deserializedRequestLine;
  }

  isActive() {
    return this.getAireData()?.estado === STATE.ACTIVE;
  }

  isTerminated() {
    return this.getAireData()?.estado === STATE.FINISHED;
  }

  prepareRequestDetail() {
    const aireData = this.getAireData();

    return {
      createdAt: aireData?.fecha_insercion ?? null,
      deferredPortability: aireData?.f_portabilidad_diferida ?? null,
      status: aireData?.estado_detallado ?? null,
      windowChange: aireData?.f_ventana_cambio ?? null,
      portability: Boolean(aireData?.f_portabilidad_diferida),
      observations: (aireData?.observaciones ?? []).map(
        ({ hora, fecha, incidencia }) => {
          return {
            date: fecha,
            hour: hora,
            description: incidencia,
          };
        },
      ),
    };
  }

  static associate(allModels: DatabaseModels) {
    AireRequest.belongsTo(allModels.GfContractDataCell, {
      foreignKey: 'code',
      targetKey: 'providerRequestCode',
    });

    AireRequest.belongsTo(allModels.GfClient, {
      foreignKey: 'fiscal_id',
      targetKey: 'fiscalId',
    });
  }
}

export function init(sequelize: Sequelize) {
  AireRequest.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fiscal_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      request: {
        type: DataTypes.TEXT('medium'),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'aire_requests',
      schema: config('index.sequelize.system.database'),
      timestamps: true,

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

  return AireRequest;
}
