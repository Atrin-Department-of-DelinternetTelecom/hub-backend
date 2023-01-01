'use strict';

import {
  findAndDeleteIntranet,
  getAllEntities,
} from '@api/utils/request-handler';
import {
  fixCalculation,
  syncWithOtherEntities,
  validateAndSanitizeFee,
} from '@api/service/intranet/Fee/GfFeeService';

import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { InitialFee } from '@api/models/intranet/intranet_initial_fee';
import { Op } from 'sequelize';
import { createRoute } from '@api/utils/controller-factory';
import { errors } from '@api/http/http_errors';
import { intranet } from '@models';
import { respondCreated } from '@api/utils/response';

const { GfCapexType } = intranet;

export const createGfFee = createRoute({
  async handler(req, res) {
    const body = req.swagger.params.body.value;
    if (!(await validateAndSanitizeFee(body)))
      throw new errors.BadRequest(`invalid fee data`);

    if (await GfFee.findOne({ where: { tpvCode: body.tpvCode } }))
      throw new errors.BadRequest(`duplicate tpvCode`);

    const fee = await GfFee.create(body);
    await syncWithOtherEntities(fee, body);

    const fix = await fixCalculation(fee.id);
    return respondCreated({ ...fee.get({ plain: true }), ...fix });
  },
});

export const getGfFee = createRoute({
  handler(req) {
    return getAllEntities(req.query, GfFee, undefined, [
      {
        model: GfFeeGroup,
        as: 'feeGroup',
        required: false,
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
      },
      {
        model: GfCellProvider,
        as: 'cellProviders',
        required: false,
      },
      {
        model: GfCellProviderFee,
        as: 'cellProviderFees',
        required: false,
      },
      {
        model: GfCapexType,
        as: 'internetCapexTypes',
        required: false,
      },
      {
        model: InitialFee,
        required: false,
      },
    ]);
  },
});

export const getGfFeeById = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const fee = await GfFee.findOne({
      where: {
        id,
      },
      include: [
        {
          model: GfFeeGroup,
          as: 'feeGroup',
          required: false,
          include: [
            {
              model: GfSection,
              as: 'sections',
              required: false,
            },
          ],
        },
        {
          model: GfCellProvider,
          as: 'cellProviders',
          required: false,
        },
        {
          model: GfCellProviderFee,
          as: 'cellProviderFees',
          required: false,
        },
        {
          model: GfCapexType,
          as: 'internetCapexTypes',
          required: false,
        },
        {
          model: InitialFee,
          required: false,
        },
      ],
    });

    if (!fee) throw new errors.NotFound(`fee with id ${id} not found`);

    const fix = await fixCalculation(id);
    return { ...fee.get({ plain: true }), ...fix };
  },
});

export const updateGfFee = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    const fee = await GfFee.findByPk(id);
    if (!fee) throw new errors.NotFound(`fee with id ${id} not found`);

    if (
      await GfFee.findOne({
        where: { tpvCode: body.tpvCode, id: { [Op.not]: id } },
      })
    )
      throw new errors.BadRequest(`duplicate tpvCode`);

    if (!(await validateAndSanitizeFee(body)))
      throw new errors.BadRequest(`invalid fee data`);

    await fee.update(body);

    await syncWithOtherEntities(fee, body);

    const fix = await fixCalculation(id);
    return { ...fee.get({ plain: true }), ...fix };
  },
});

export const deleteGfFee = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return findAndDeleteIntranet(id, GfFee);
  },
});
