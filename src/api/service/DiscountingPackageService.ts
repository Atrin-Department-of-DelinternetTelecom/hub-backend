import { throwIf, throwUnless } from '@api/utils/helpers';
import { system, intranet, AnyModel } from '@models';
import moment from 'moment';
import { Op } from 'sequelize';
const { DiscountingPackage, DiscountingPackageFee, DiscountingPackageMatrix } =
  system;
const {
  GfClient,
  GfContract,
  GfFeeGroup,
  GfFeegroupsGroupLabel,
  GfFeegroupsLabelsXref,
  GfFeegroupsGroupLabelsXref,
  GfFeegroupsLabel,
  GfDiscountsExecuted,
  GfDiscountsMatrix,
  GfDiscountsMatrixRule,
  InvoiceClient,
  InvoiceClientsExtraField,
  InvoiceClientExtraFieldXref,
} = intranet;

export default class {
  static async createDiscount(discountPackage: AnyModel) {
    // first mark fee group by new labels
    await this.createLabels(discountPackage);
    // then generate discounts
    await this.createMatrices(discountPackage);
  }

  /**
   * Create new GfFeegroupsGroupLabel,GfFeegroupsGroupLabel for given discount package.
   */
  static async createLabels(
    discountPackage: AnyModel,
  ): Promise<{ [key: string]: AnyModel }> {
    const label = await GfFeegroupsLabel.create({
      name: `${discountPackage.name} [${discountPackage.code}]`,
    });
    const labelGroup = await GfFeegroupsGroupLabel.create({
      name: `${discountPackage.name} [${discountPackage.code}]`,
    });

    const attachedFeeGroups = await discountPackage.getDiscountingPackageFees();

    await Promise.all(
      attachedFeeGroups.flatMap((pivot: AnyModel) => {
        return [
          GfFeegroupsGroupLabelsXref.create({
            labelId: labelGroup.id,
            feeGroupId: pivot.gf_fee_group_id,
          }),
          GfFeegroupsLabelsXref.create({
            labelId: label.id,
            feeGroupId: pivot.gf_fee_group_id,
          }),
        ];
      }),
    );

    // store for next usages
    await discountPackage.update({
      label_group_id: labelGroup.id,
      label_id: label.id,
    });

    return { label, labelGroup };
  }

  static async createMatrices(discountPackage: AnyModel) {
    const attachedFeeGroups = await discountPackage.getDiscountingPackageFees();

    const discounts = await Promise.all(
      attachedFeeGroups.map((pivot: AnyModel) =>
        GfDiscountsMatrix.create({
          feeGroupId: pivot.gf_fee_group_id,
          feeGroupLabelId: discountPackage.label_group_id,
          numberOfMonths: discountPackage.months,
          active: 1,
          alias: `${discountPackage.name} [${discountPackage.code}]`,
          discountType: pivot.type,
          discount: pivot.amount,
          idTpv: discountPackage.code,
        }),
      ),
    );

    await Promise.all(
      discounts.map((discount) =>
        GfDiscountsMatrixRule.create({
          matrixId: discount.id,
          type: 'labeled_contract_present',
          presentLabelId: discountPackage.label_id,
          maxDaysTargetExists: Math.abs(
            moment().diff(
              moment().add(discountPackage.months, 'months'),
              'days',
            ),
          ),
          maxDaysExists: 0,
        }),
      ),
    );

    await discountPackage.setGfDiscountsMatrices([]);
    await DiscountingPackageMatrix.bulkCreate(
      discounts.map((matrix) =>
        Object({
          gf_discounts_matrix_id: matrix.id,
          discounting_package_id: discountPackage.id,
        }),
      ),
    );
  }

  /**
   * Check if a contract has reason to exclude from discounting.
   */
  static async checkExclusion(
    matrix: AnyModel,
    contractId: number,
  ): Promise<void> {
    const discountPackage = await DiscountingPackage.findOne({
      include: [
        {
          model: DiscountingPackageFee,
          required: false,
          include: [
            {
              model: GfFeeGroup,
              required: true,
              attributes: ['id'],
            },
          ],
        },
        { model: GfClient, required: false, attributes: ['id'] },
        {
          model: InvoiceClientsExtraField,
          required: false,
          attributes: ['id'],
        },
        {
          model: GfDiscountsMatrix,
          where: { id: matrix.id },
          required: true,
          attributes: ['id'],
        },
      ],
    });

    if (discountPackage === null) {
      // created out of discounting package
      return;
    }

    throwIf(
      !discountPackage.enabled,
      `Discounting is disabled for pacakge${discountPackage.id}`,
    );

    const contract = await GfContract.findByPk(contractId);
    // missing contract
    throwIf(contract === null, `Contract not found`);
    // cehck if client activated all package contracts
    await this.checkActiveContracts(discountPackage, contract!.clientId);
    // we creating a discount matrix for each fee group
    // to prevent apply discount for only one fee group
    // ignoring other contracts included in discount pacakge with diffrent fee groups
    throwIf(
      contract!.feeGroupId !== matrix.feeGroupId,
      `Contract feeGroup:${
        contract!.feeGroupId
      } is different of discount feeGroup:${matrix.feeGroupId}`,
    );
    // checking if the contract is created out of the discounting date
    throwIf(
      !moment(contract!.creationDate).isBetween(
        moment(discountPackage.start_date),
        moment(discountPackage.expiration_date),
      ),
      `Out of date contract`,
    );
    // checking client resteriction
    await this.checkClientRestriction(discountPackage, contract!);
  }

  /**
   * Ensure client activated all of the discounting package fee groups.
   */
  static async checkActiveContracts(
    discountPackage: AnyModel,
    clientId: number,
  ) {
    const contracts = await GfContract.findAll({
      where: {
        clientId,
        dateActivation: {
          [Op.lte]: moment()
            .subtract(discountPackage.activation_age, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
        },
        dateDeactivation: null,
        creationDate: {
          [Op.between]: [
            discountPackage.start_date,
            discountPackage.expiration_date,
          ],
        },
      },
      attributes: ['id', 'feeGroupId', 'clientId'],
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          attributes: ['id'],
          required: true,
          where: {
            id: discountPackage.DiscountingPackageFees.map(
              (pivot: AnyModel) => pivot.gf_fee_group_id,
            ),
          },
        },
      ],
    });

    throwIf(
      contracts.length < discountPackage.DiscountingPackageFees.length,
      `Missing required active contracts`,
    );
  }

  /**
   * Check if any client restriction is found in the package for the given contract and matrix id.
   */
  static async checkClientRestriction(
    discountPackage: AnyModel,
    contract: AnyModel,
  ): Promise<void> {
    const clients = discountPackage.GfClients;
    const taggedClients = discountPackage.InvoiceClientsExtraFields;

    if (taggedClients.length + clients.length <= 0) {
      // package doesn't have any client restriction
      return;
    }

    const client = await contract.getClient({
      include: [
        {
          model: InvoiceClient,
          as: 'invoiceClient',
          required: true,
          include: [
            {
              model: InvoiceClientExtraFieldXref,
              as: 'extraFields',
              required: true,
              where: {
                extraFieldId: taggedClients.map((tag: AnyModel) => tag.id),
              },
            },
          ],
        },
      ],
    });

    if (client !== null) {
      // client is includes discounting through tag
      return;
    }

    // client is not includes discounting
    throwIf(
      !clients.find((client: AnyModel) => client.id === contract!.clientId),
      'Exlcude by discount package client restriction',
    );
  }
  /**
   * Check if discount can be execute for given contract.
   * Here we prevent duplication execute when a fee group attached multiple into a package.
   */
  static async canExecute(matrixId: number, targetContractId: number) {
    const discountPackage = await DiscountingPackage.findOne({
      include: [
        {
          model: GfDiscountsMatrix,
          where: { id: matrixId },
          required: true,
          attributes: ['id', 'feeGroupId'],
        },
      ],
    });

    if (discountPackage === null) {
      // added out of the discounting package
      return;
    }

    throwIf(
      !discountPackage.enabled,
      `Discounting is disabled for pacakge${discountPackage.id}`,
    );

    const matrices = await discountPackage.getGfDiscountsMatrices();
    const applied = await GfDiscountsExecuted.findOne({
      where: {
        matrixId: matrices.map((matrix: AnyModel) => matrix.id),
        targetContractId,
        active: 1,
      },
    });

    throwIf(applied !== null, 'Applied once');
  }
}
