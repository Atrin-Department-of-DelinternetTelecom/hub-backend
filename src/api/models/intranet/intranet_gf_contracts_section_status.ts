import { AnyModel, DatabaseModels } from '@models';
import { DataTypes, Model, Sequelize } from 'sequelize';
import {
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';

import { GfSection } from './intranet_gf_sections';
import { get as config } from '@config';
import { defaultScope } from '@utils/intranet';

export class GfContractSectionStatus extends Model {
  declare id: number;
  declare uid: number | null;
  declare contractId: number | null;
  declare sectionId: number | null;
  declare state: SECTION_STATUS;
  declare lastError: string | null;
  declare pendingState: SECTION_STATUS_PENDINGS;
  declare status: number | null;
  declare creationDate: Date | null;
  declare updateDate: Date | null;
  // relationships
  declare contract: AnyModel;
  declare section: GfSection;

  static associate(models: DatabaseModels) {
    GfContractSectionStatus.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractSectionStatus.belongsTo(models.GfSection, {
      foreignKey: 'sectionId',
      as: 'section',
    });
  }

  static async findStatusOrCreate(
    contractId: number,
    sectionId: number,
    state: SECTION_STATUS,
    blocked: boolean,
    error: string | null = null,
    pending: SECTION_STATUS_PENDINGS | null = null,
  ) {
    return GfContractSectionStatus.updateStatusOrCreate(
      contractId,
      sectionId,
      state,
      blocked,
      error,
      pending,
    );
  }

  static async updateStatusOrCreate(
    contractId: number,
    sectionId: number,
    state: SECTION_STATUS,
    blocked: boolean,
    error: string | null = null,
    pending: SECTION_STATUS_PENDINGS | null = null,
  ) {
    const newState = blocked ? SECTION_STATUS.BLOCKED : state;
    const lastError = state == SECTION_STATUS.ERROR && error ? error : null;
    const pendingState = pending ? pending : null;
    const [instance, created] = await GfContractSectionStatus.findOrCreate({
      where: {
        contractId: contractId,
        sectionId: sectionId,
      },
      defaults: {
        state: newState,
      },
    });

    instance.set({ pendingState, lastError, state: newState });

    // Note that .changed() won't work after .save() or .update()
    const status = {
      created,
      stateChanged: instance.changed('state'),
      pendingStateChanged: instance.changed('pendingState'),
      lastErrorChanged: instance.changed('lastError'),
    };

    if (instance.changed()) {
      await instance.save();
    }

    return [instance, status];
  }

  static getStates() {
    return Object.values(SECTION_STATUS);
  }
}

export function init(sequelize: Sequelize) {
  GfContractSectionStatus.init(
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
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
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM(...Object.values(SECTION_STATUS)),
        allowNull: true,
      },
      lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pendingState: {
        type: DataTypes.STRING,
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
      tableName: 'gf_contracts_section_status',
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

  return GfContractSectionStatus;
}
