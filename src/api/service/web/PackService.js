'use strict';

const {
  Pack,
  CategoryPack,
  Category,
  Definition,
  Section,
  User,
  Text,
  Fee,
  LastUpdate,
} = require('@models').system;

const { GfFeeGroup, GfFee } = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndUpdate,
  findAndGet,
  findAndDelete,
} = require('@utils/request-handler');

const {
  respondBadRequest,
  respondNotFound,
  respondCreated,
  respondSuccess,
} = require('@utils/response');

const _ = require('lodash');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a pack record by id
 *
 * id String
 * returns Object
 **/
exports.deletePacksId = async function (id) {
  return await findAndDelete(id, Pack);
};

/**
 * Your GET endpoint
 * get all packs(information) record
 *
 * returns Object
 **/
exports.getPacks = async function (query) {
  return await getAllEntities(query, Pack);
};

/**
 * Your GET endpoint
 * get single pack record by id
 *
 * id String
 * returns Object
 **/
exports.getPacksId = async function (id) {
  const pack = await Pack.findByPk(parseInt(id), {
    include: [
      {
        model: Definition,
        as: 'definitions',
        include: [
          {
            model: Section,
            as: 'sections',
            include: {
              model: Fee,
              as: 'fees',
              include: {
                model: GfFeeGroup,
                as: 'fee_group',
                include: {
                  model: GfFee,
                  as: 'gf_fees',
                },
              },
            },
          },
          {
            model: Text,
            as: 'texts',
          },
        ],
      },
      {
        model: User,
        as: 'creator',
      },
      {
        model: Category,
        as: 'categories',
      },
    ],
  });
  if (!pack) {
    return respondNotFound('pack not found');
  }
  return respondSuccess(pack);
};

/**
 *
 * add a pack record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postPacks = async function (body, creator_id) {
  body.creator_id = creator_id;
  const { category_ids } = body;
  delete body.category_ids;

  // validate category id's
  const keys = Object.keys(category_ids);
  for (const key of keys) {
    const category = await Category.findByPk(category_ids[key]);
    if (_.isNull(category)) {
      return respondNotFound('category not found');
    }
  }

  const newPack = await Pack.create(body);

  //attach category id's
  for (const key of keys) {
    await CategoryPack.create({
      category_id: category_ids[key],
      pack_id: newPack.id,
      type: body.type,
      creator_id,
    });
  }

  return respondCreated(
    await Pack.findByPk(newPack.id, {
      include: [
        {
          model: Definition,
          as: 'definitions',
          include: [
            {
              model: Section,
              as: 'sections',
              include: {
                model: Fee,
                as: 'fees',
              },
            },
            {
              model: Text,
              as: 'texts',
            },
          ],
        },
        {
          model: Category,
          as: 'categories',
        },
        {
          model: User,
          as: 'creator',
        },
      ],
    }),
  );
};

/**
 *
 * update a pack record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected pack (optional)
 * returns Object
 **/
exports.putPacksId = async function (id, body) {
  //return await findAndUpdate(id, body, Pack);
  const pack = await Pack.findByPk(id);
  if (_.isNull(pack)) {
    return respondNotFound('pack not found');
  }

  await Pack.update(body, {
    where: {
      id,
    },
  });

  return respondSuccess(
    await Pack.findByPk(id, {
      include: [
        {
          model: Definition,
          as: 'definitions',
          include: [
            {
              model: Section,
              as: 'sections',
              include: {
                model: Fee,
                as: 'fees',
                include: {
                  model: GfFeeGroup,
                  as: 'fee_group',
                  include: {
                    model: GfFee,
                    as: 'gf_fees',
                  },
                },
              },
            },
            {
              model: Text,
              as: 'texts',
            },
          ],
        },
        {
          model: User,
          as: 'creator',
        },
        {
          model: Category,
          as: 'categories',
        },
      ],
    }),
  );
};

Pack.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Pack.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
