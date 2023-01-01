'use strict';

import { AnyModel, DatabaseModels } from '@models';
import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';

import { get as config } from '@config';
import { randomBytes } from 'crypto';

export class SatisfactionForm extends Model {
  declare id: CreationOptional<number>;
  declare filled: CreationOptional<boolean>;
  declare technician_task_id: CreationOptional<number>;
  declare form_id: string;
  declare smspubli_report_id: string;
  declare answers: Record<string, unknown>;
  declare sentAt?: Date;
  declare createdAt: Date;
  declare updatedAt: Date;
  // relationships
  declare TechnicianTask?: AnyModel;
  declare SmspubliReport?: AnyModel;

  static associate(models: DatabaseModels) {
    SatisfactionForm.belongsTo(models.TechnicianTask, {});
    SatisfactionForm.belongsTo(models.SmspubliReport);
  }

  ensureOfFormId() {
    this.form_id ||
      this.set(
        'form_id',
        randomBytes(Math.ceil(10 / 2))
          .toString('hex')
          .slice(0, 10),
      );

    return this;
  }

  setMessageReport(messageId: string | number) {
    return this.update({ SmspubliReportId: messageId });
  }

  static findByFormId(formId: string) {
    return SatisfactionForm.findOne({ where: { form_id: formId } });
  }

  static findUnfilledByFormId(formId: string) {
    return SatisfactionForm.findOne({
      where: { filled: false, form_id: formId },
    });
  }

  static defaultAnswers() {
    return {
      arrive_time: null,
      installation_time: null,
      explanation: null,
      suggestion: null,
      connection: null,
      behavior: null,
      rating: 0,
    };
  }
}

export function init(sequelize: Sequelize) {
  SatisfactionForm.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      filled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      technician_task_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      form_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      answers: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '{}',
        set(answers) {
          this.setDataValue(
            'answers',
            JSON.stringify(
              typeof answers === 'object'
                ? answers
                : SatisfactionForm.defaultAnswers(),
            ),
          );
        },
        get() {
          return {
            ...SatisfactionForm.defaultAnswers(),
            ...JSON.parse(this.getDataValue('answers') ?? '{}'),
          };
        },
      },
      questions: {
        type: DataTypes.VIRTUAL,
        allowNull: true,
        set(answers) {},
        get() {
          return {
            arrive_time: 'El tècnic va arribar a temps?',
            installation_time:
              'Va acabar la instal·lació en dues hores o menys?',
            explanation:
              'El tècnic et va explicar bé totes les característiques i configuracions del router?',
            suggestion:
              'El tècnic et va proposar el lloc més adequat per instal·lar el router?',
            connection:
              'El tècnic es va assegurar que la seva connexió a internet funciones correctament?',
            behavior: 'Va quedar satisfet amb el comportament del tècnic?',
            rating: "En general, puntua el tècnic de l'u al cinc.",
          };
        },
      },
      sentAt: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
      },
      filledAt: {
        type: DataTypes.DATE,
        defaultValue: null,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'satisfaction_forms',
      timestamps: true,
      paranoid: false,
      underscored: true,
      schema: config('index.sequelize.system.database'),
      hooks: {
        beforeCreate(model, options) {
          model.ensureOfFormId();
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
  return SatisfactionForm;
}
