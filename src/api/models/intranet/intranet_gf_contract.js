'use strict';

const { Op, fn, where: whereQuery, col, literal } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');
const { default: to } = require('await-to-js');
const { CONTRACT, RADIUS_STATE } = require('@api/constants/statuses');
const { INTERNET_TECHNOLOGY, SERVICE } = require('@api/constants/contracts');
const moment = require('moment');
const { intranet: knex } = require('@lib/knex');

module.exports = function (sequelize, DataTypes) {
  const GfContract = sequelize.define(
    'GfContract',
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
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      linkedContractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      frozen: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
      alias: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      imported: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      payDay: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
        set(value) {
          this.setDataValue('payDay', Number(value) || 1);
        },
      },
      invoiceMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1001,
        set(value) {
          this.setDataValue('invoiceMonths', Number(value) || 1001);
        },
      },
      invoiceProfileId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        set(value) {
          this.setDataValue('invoiceProfileId', Number(value) || null);
        },
        get() {
          return Number(this.getDataValue('invoiceProfileId')) || null;
        },
      },
      feeGroupId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      percentageDiscount: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        get() {
          return parseFloat(this.getDataValue('percentageDiscount') || 0.0);
        },
      },
      dateActivation: {
        type: DataTypes.DATE,
        allowNull: true,
        set(value) {
          this.setDataValue('dateActivation', value || null);
        },
      },
      dateDeactivation: {
        type: DataTypes.DATE,
        allowNull: true,
        set(value) {
          this.setDataValue('dateDeactivation', value || null);
        },
      },
      dateInsertion: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      tempDateMustBeActivation: {
        type: DataTypes.DATE,
        allowNull: true,
        set(value) {
          this.setDataValue('tempDateMustBeActivation', value || null);
        },
      },
      collaboratorId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM(
          'active',
          'pendingChange',
          'suspended',
          'pendingSectionsReady',
          'blocked',
        ),
        allowNull: true,
      },
      sellerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        set(value) {
          this.setDataValue('sellerId', value || null);
        },
      },
      permanence: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      permanenceEnd: {
        type: DataTypes.DATE,
        allowNull: true,
        set(value) {
          this.setDataValue('permanenceEnd', value || null);
        },
      },
      permanencePvp: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
        get() {
          return parseFloat(this.getDataValue('permanencePvp') || 0.0);
        },
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
      type: {
        type: DataTypes.VIRTUAL,
        get() {
          const section =
            this.fee_group?.sections?.[0] ?? this.statuses?.[0]?.section;

          return section?.code;
        },
        set() {
          // throw new Error('Do not try to set the `fullName` value!');
        },
      },
      pendingDiscounts: {
        type: DataTypes.VIRTUAL,
      },
      useCpe: {
        type: DataTypes.VIRTUAL,
        get() {
          if (this.type !== SERVICE.INTERNET) {
            return false;
          }

          const fee = this.fee_group?.gf_fees?.[0];

          return fee?.internetTechnology !== INTERNET_TECHNOLOGY.RADIO;
        },
        set() {
          // throw new Error('Do not try to set the `fullName` value!');
        },
      },
    },
    {
      sequelize,
      tableName: 'gf_contracts',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },

      scopes: {
        linkedContract(contractId) {
          return {
            where: {
              linkedContractId: contractId,
            },
          };
        },
        suspended: {
          where: {
            state: 'suspended',
          },
        },
        active: {
          where: {
            state: 'active',
          },
        },
        pendingChange: {
          where: {
            state: 'pendingChange',
          },
        },
        pendingSectionsReady: {
          where: {
            state: 'pendingSectionsReady',
          },
        },
        blocked: {
          where: {
            state: 'blocked',
          },
        },
      },

      hooks: {
        afterCreate: async (model, { transaction }) => {
          if (!model.reference) {
            model.fillReferenceCode();
            await model.save({ transaction });
          }
        },
        beforeSave: (model) => {
          if (!model.reference && model.id) {
            model.fillReferenceCode();
          }
        },
        afterSave: async (contract, options) => {
          await updateMeiliSearch(contract);

          await sequelize.models.GfDoc.findAll({
            where: { contractId: contract.id },
          })
            .then((gfDocs) => {
              gfDocs.map((gfDoc) =>
                gfDoc.constructor.runHooks('afterUpdate', gfDoc),
              );
            })
            .catch((error) => {
              console.log('Failed clean document cahces');
              console.log(error.toString());
            });
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

  GfContract.associate = function (models) {
    GfContract.belongsTo(models.GfFeeGroup, {
      foreignKey: 'feeGroupId',
      as: 'fee_group',
    });
    GfContract.hasMany(models.GfDiscountsExecutedUsage, {
      foreignKey: 'typeId',
      as: 'as_usages',
    });
    GfContract.hasMany(models.PackageStatusContract, {
      foreignKey: 'contractId',
      as: 'package_statuses',
    });
    GfContract.hasMany(models.GfIncidence, {
      foreignKey: 'contractId',
      as: 'open_incidences',
      scope: {
        ..._.get(intranet, 'defaultScope.where', {}),
        closed: 0,
      },
    });

    GfContract.hasMany(models.GfAssist, {
      foreignKey: 'contractId',
      as: 'assists',
    });
    GfContract.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });

    GfContract.hasMany(models.GfDiscountsExecuted, {
      foreignKey: 'targetContractId',
      as: 'executed',
    });

    GfContract.belongsTo(models.GfUser, {
      foreignKey: 'sellerId',
      targetKey: 'userId',
      as: 'seller',
    });

    GfContract.hasMany(models.GfContractHolderChange, {
      foreignKey: 'contractId',
      as: 'holders',
    });

    GfContract.hasMany(models.GfContractFeeChange, {
      foreignKey: 'contractId',
      as: 'change_fees',
    });

    GfContract.hasMany(models.GfBonusHistory, {
      foreignKey: 'contractId',
      as: 'change_bonus',
    });

    GfContract.hasMany(models.GfContractUnpaid, {
      foreignKey: 'contractId',
      as: 'blocks',
    });

    GfContract.belongsTo(models.InvoiceClientsInvoiceProfile, {
      foreignKey: 'invoiceProfileId',
      as: 'invoiceProfile',
    });
    GfContract.belongsTo(models.GfContract, {
      foreignKey: 'linkedContractId',
      as: 'linkedContract',
    });
    GfContract.hasOne(models.GfContractDataCell, {
      foreignKey: 'contractId',
      as: 'dataCell',
    });
    GfContract.hasOne(models.GfContractDataFix, {
      foreignKey: 'contractId',
      as: 'dataFix',
    });
    GfContract.hasOne(models.GfContractDataInternet, {
      foreignKey: 'contractId',
      as: 'dataInternet',
    });
    GfContract.hasOne(models.GfContractDataTv, {
      foreignKey: 'contractId',
      as: 'dataTv',
    });
    GfContract.hasOne(models.GfContractDataSubscription, {
      foreignKey: 'contractId',
      as: 'dataSubscription',
    });
    GfContract.hasMany(models.GfContractSectionStatus, {
      foreignKey: 'contractId',
      as: 'statuses',
    });
    // contract.hasMany(models.GfContract, {
    //   foreignKey: 'linkedContractId',
    //   as: 'linkedContracts'
    // });
    GfContract.hasMany(models.GfDiscountsScheduled, {
      foreignKey: 'contractId',
      as: 'discounts',
    });
    GfContract.belongsToMany(models.GfBonus, {
      through: {
        model: models.GfBonusContractXref,
        scope: _.get(intranet, 'defaultScope.where', {}),
      },
      foreignKey: 'contractId',
      otherKey: 'bonoId',
      as: 'bonuses',
    });
    GfContract.hasMany(models.GfFee, {
      foreignKey: 'feeGroupId',
      sourceKey: 'feeGroupId',
      as: 'fees',
    });
    GfContract.hasOne(models.GfAireContract, {
      foreignKey: 'linkedContractId',
    });
    GfContract.belongsTo(models.GfActiveFee, {
      foreignKey: 'feeGroupId',
      targetKey: 'feeGroupId',
      as: 'activeFee',
    });
    GfContract.hasOne(models.GfContractSection, {
      foreignKey: 'id',
      targetKey: 'id',
      as: 'section',
    });
    GfContract.belongsToMany(models.ContractTag, {
      through: {
        model: models.ContractTagMapping,
      },
      foreignKey: 'gfContractId',
      otherKey: 'contractTagId',
      as: 'tags',
    });
    GfContract.belongsToMany(models.InitialFee, {
      through: models.ContractInitialFee,
    });
  };

  const generateReference = (model) => {
    return (
      'C' +
      String(model.id).padStart(6, 0) +
      '-' +
      String(model.feeGroupId).padStart(4, 0) +
      '-' +
      String(model.clientId).padStart(6, 0)
    );
  };

  GfContract.prototype.fillReferenceCode = function () {
    return this.set('reference', generateReference(this));
  };

  GfContract.prototype.isActive = function () {
    return this.state === CONTRACT.ACTIVE;
  };
  GfContract.prototype.isPendingChange = function () {
    return this.state === CONTRACT.PENDING_CHANGE;
  };
  GfContract.prototype.isSuspended = function () {
    return this.state === CONTRACT.SUSPENDED;
  };
  GfContract.prototype.isPendingSectionsReady = function () {
    return this.state === CONTRACT.PENDING_SECTION_READY;
  };
  GfContract.prototype.isBlocked = function () {
    return this.state === CONTRACT.BLOCKED;
  };
  GfContract.prototype.isAvailable = function () {
    return this.isBlocked() || this.isActive();
  };
  GfContract.prototype.isFrozen = function () {
    return Boolean(this.frozen);
  };

  GfContract.prototype.matchesAireLine = function (
    /** @type {import('@delinternet/sdk-aire').Line} */ aireLine,
  ) {
    if (!this.matchesAireLineClient(aireLine)) {
      return false;
    }

    if (aireLine.activo === 'SI' && this.isAvailable()) {
      return true;
    }

    return aireLine.activo === 'NO' && this.isSuspended();
  };

  GfContract.prototype.matchesAireLineClient = function (
    /** @type {import('@delinternet/sdk-aire').Line} */ aireLine,
  ) {
    return (
      String(this.client?.fiscalId).toLowerCase() ===
      String(aireLine.fiscalId).toLowerCase()
    );
  };

  GfContract.prototype.getFee = function () {
    const fees = this.fee_group?.gf_fees;
    if (!fees) {
      throw new Error(`Please include fee_group and gf_fess in the query`);
    }

    if (fees.length === 0) {
      return null;
    }

    // return the fee with biggest id
    const sorted = fees.sort((a, b) => b.id - a.id);
    return sorted[0];
  };

  GfContract.selectFromInternetId = async function (contractId) {
    return GfContract.findAll({
      where: {
        state: {
          [Op.not]: 'suspended',
        },
      },
      include: [
        {
          model: sequelize.models.GfContractDataFix,
          as: 'dataFix',
          where: {
            internetSectionId: contractId,
          },
        },
      ],
    });
  };

  GfContract.selectFromInternetId = async function (contractId) {
    return GfContract.findAll({
      where: {
        state: {
          [Op.not]: 'suspended',
        },
      },
      include: [
        {
          model: sequelize.models.GfContractDataFix,
          as: 'dataFix',
          where: {
            internetSectionId: contractId,
          },
        },
      ],
    });
  };

  GfContract.linkedContracts = async (contractId) => {
    return GfContract.findAll({ where: { linkedContractId: contractId } });
  };

  GfContract.searchDataSection = async (value) => {
    const models = sequelize.models;
    const likeString = `%${value.replace(/%/g, '')}%`;
    let ids = [];

    const fixes = await models.GfContractDataFix.findAll({
      attributes: ['contractId'],
      where: {
        number: {
          [Op.like]: likeString,
        },
      },
    });
    ids = ids.concat(fixes.map((fix) => fix.contractId));

    const cells = await models.GfContractDataCell.findAll({
      attributes: ['contractId'],
      where: {
        number: {
          [Op.like]: likeString,
        },
      },
    });
    ids = ids.concat(cells.map((cell) => cell.contractId));

    const internets = await models.GfContractDataInternet.findAll({
      attributes: ['contractId'],
      where: {
        [Op.or]: {
          ip: {
            [Op.like]: likeString,
          },
          guifiNetIp: {
            [Op.like]: likeString,
          },
          infoRepair: {
            [Op.like]: likeString,
          },
          cpeSn: {
            [Op.like]: likeString,
          },
          nodeRadiusName: {
            [Op.like]: likeString,
          },
        },
      },
    });
    ids = ids.concat(internets.map((internet) => internet.contractId));

    return {
      key: 'id',
      where: _.uniq(ids),
    };
  };

  /**
   * Search query for supplier and ... column
   *
   * @param  string value
   * @return Object
   */
  GfContract.searchSupplier = async (value) => {
    const models = sequelize.models;
    const likeString = `%${value.replace(/%/g, '')}%`;

    const feeGroups = await models.GfFeeGroup.findAll({
      attributes: ['id'],
      where: {
        name: {
          [Op.like]: likeString,
        },
      },
    });

    const fees = await models.GfFee.findAll({
      attributes: ['feeGroupId'],
      include: [
        {
          model: models.GfCapexType,
          as: 'internetCapexTypes',
          required: true,
          where: {
            supplier: {
              [Op.like]: likeString,
            },
          },
        },
      ],
    });

    const dataInternets = await models.GfContractDataInternet.findAll({
      attributes: ['contractId'],
      where: {
        providerCode: {
          [Op.like]: likeString,
        },
      },
    });

    return {
      key: Op.or,
      where: {
        // supplier and fee-group name filter
        feeGroupId: feeGroups
          .map((feeGroup) => feeGroup.id)
          .concat(fees.map((fee) => fee.feeGroupId)),
        // provider code filter
        id: dataInternets.map((dataInternet) => dataInternet.contractId),
        alias: {
          [Op.like]: likeString,
        },
        reference: {
          [Op.like]: likeString,
        },
      },
    };
  };

  GfContract.searchType = async (value) => {
    const feeGroups = await sequelize.models.GfFeeGroup.findAll({
      attributes: ['id'],
      include: [
        {
          model: sequelize.models.GfSection,
          as: 'sections',
          required: true,
          where: {
            code: String(value).toUpperCase(),
          },
        },
      ],
    });

    return {
      key: 'feeGroupId',
      where: feeGroups.map((feeGroup) => feeGroup.id),
    };
  };

  GfContract.searchCustomer = async (value) => {
    const likeString = `%${value.replace(/%/g, '')}%`;
    const { GfClient, GfContract, GfContractDataFix, GfContractDataInternet } =
      sequelize.models;

    const clients = await GfClient.findAll({
      raw: true,
      attributes: ['id'],
      where: {
        [Op.or]: {
          fiscalId: {
            [Op.like]: likeString,
          },
          name: {
            [Op.like]: likeString,
          },
        },
      },
    });

    const where = {
      [Op.and]: value
        .replace(/%/g, '')
        .split(' ')
        .map((key) => {
          return whereQuery(
            fn(
              'concat_ws',
              ' ',
              col('addressRegion'),
              col('addressProvince'),
              col('addressCity'),
              col('addressStreet'),
              col('addressNumber'),
              col('addressPostalCode'),
            ),
            { [Op.like]: `%${key}%` },
          );
        }),
    };

    const internets = await GfContract.findAll({
      raw: true,
      attributes: ['id'],
      include: [
        {
          raw: true,
          attributes: [],
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: true,
          where,
        },
      ],
    });

    const fixes = await GfContract.findAll({
      raw: true,
      attributes: ['id'],
      include: [
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: true,
          raw: true,
          attributes: [],
          include: [
            {
              model: GfContractDataInternet,
              as: 'dataInternet',
              required: true,
              raw: true,
              where,
              attributes: [],
            },
          ],
        },
      ],
    });

    return {
      key: Op.or,
      where: {
        clientId: clients.map((client) => client.id),
        id: internets
          .map((contract) => contract.id)
          .concat(fixes.map((contract) => contract.id)),
      },
    };
  };

  GfContract.searchCard = async (value) => {
    const likeString = `%${value.replace(/%/g, '')}%`;
    const {
      GfContractDataFix,
      GfContractDataInternet,
      GfContractDataCell,
      GfContract,
      GfFeeGroup,
    } = sequelize.models;

    const contracts = await GfContract.findAll({
      attributes: ['id'],
      where: {
        [Op.or]: {
          alias: {
            [Op.like]: likeString,
          },
          reference: {
            [Op.like]: likeString,
          },
          '$dataInternet.cpeSn$': {
            [Op.like]: likeString,
          },
          '$dataFix.number$': {
            [Op.like]: likeString,
          },
          '$dataCell.number$': {
            [Op.like]: likeString,
          },
          '$fee_group.name$': {
            [Op.like]: likeString,
          },
          '$fee_group.internalName$': {
            [Op.like]: likeString,
          },
        },
      },
      include: [
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
        },
        {
          model: GfFeeGroup,
          as: 'fee_group',
          required: false,
        },
      ],
    });

    return {
      key: 'id',
      where: contracts.map((contract) => contract.id),
    };
  };

  GfContract.searchTags = (value) => {
    const tags = Array.isArray(value) ? value : value.split(',');
    const ref = `ct${Date.now()}`;
    const subQuery = knex(`intranet.contract_tag_mappings AS ${ref}`)
      .select(1)
      .whereIn(`${ref}.contract_tag_id`, tags)
      .andWhere(`${ref}.gf_contract_id`, knex.raw('GfContract.id'))
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: literal(`EXISTS (${subQuery})`),
    };
  };

  GfContract.searchWrongBlocking = () => {
    const ref = `wrongBlocking${Date.now()}`;
    const subQuery = knex(`intranet.gf_contracts_unpaid AS ${ref}`)
      .select(1)
      .where(`${ref}.contractId`, knex.raw('GfContract.id'))
      .where('alive', 1)
      .where('upState', 'pending')
      .where('downState', 'revoked')
      .toQuery();

    return {
      key: Op.and,
      where: [literal(`EXISTS (${subQuery})`), { state: CONTRACT.BLOCKED }],
    };
  };

  GfContract.selectAireContractByCellNumber = async (
    number = null,
    alsoSuspended = false,
  ) => {
    const models = sequelize.models;
    const cellProviders = await models.GfCellProvider.scope(
      'defaultScope',
      'aire',
    ).findAll();
    const cellProviderId = cellProviders.map((cellProvider) => cellProvider.id);
    cellProviderId.push(null);

    return GfContract.findOne({
      where: alsoSuspended ? { state: ['active', 'blocked'] } : {},
      include: [
        {
          model: models.GfContractDataCell,
          as: 'dataCell',
          required: true,
          where: { number },
        },
        {
          model: models.GfClient,
          as: 'client',
          required: true,
        },
        {
          model: models.GfFee,
          as: 'fees',
          where: {
            cellProviderId,
          },
        },
      ],
    });
  };

  GfContract.allAireContractsWithNif = async (number) => {
    const models = sequelize.models;
    const cellProviders = await models.GfCellProvider.scope(
      'defaultScope',
      'aire',
    ).findAll();

    return GfContract.findAll({
      include: [
        {
          model: models.GfContractDataCell,
          as: 'dataCell',
          required: true,
          where: { number },
        },
        {
          model: models.GfClient,
          as: 'client',
          required: true,
        },
        {
          model: models.GfFee,
          as: 'fees',
          required: true,
          where: {
            cellProviderId: cellProviders
              .map((cellProvider) => cellProvider.id)
              .push(null),
          },
          include: [
            {
              model: models.GfCellProvider,
              as: 'cellProviders',
              required: true,
            },
            {
              model: models.GfCellProviderFee,
              as: 'cellProviderFees',
              required: true,
            },
          ],
        },
      ],
    });
  };

  GfContract.getPendingContracts = async (days) => {
    return GfContract.findAll({
      where: {
        state: CONTRACT.PENDING_SECTION_READY,
        creationDate: {
          [Op.lte]: moment().subtract(days, 'days').toISOString(),
        },
      },
    });
  };

  GfContract.prototype.toSearchableObject = function () {
    return {
      type: String(this.type),
      id: this.id,
      reference: this.reference,
      alias: this.alias,
      state: this.state,
      client: this.client?.toSearchableObject() ?? null,
      dataCell: this.dataCell?.toSearchableObject() ?? null,
      dataInternet: this.dataInternet?.toSearchableObject() ?? null,
      dataFix: this.dataFix?.toSearchableObject() ?? null,
    };
  };

  const updateMeiliSearch = async (model) => {
    const {
      handle,
    } = require('@api/service/intranet/Actions/MeiliSearchContractSync');
    const [error] = await to(handle([model.id]));
  };

  GfContract.prototype.hasValidState = function (radiusGroup) {
    if (this.isActive() && radiusGroup === RADIUS_STATE.BLOCKED) {
      return false;
    }

    if (!this.isActive() && radiusGroup !== RADIUS_STATE.BLOCKED) {
      return false;
    }

    return true;
  };

  return GfContract;
};
