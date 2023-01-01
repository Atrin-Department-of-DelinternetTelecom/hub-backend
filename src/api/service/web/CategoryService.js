'use strict';

const {
  Category,
  Fee,
  Section,
  Definition,
  Pack,
  User,
  Text,
  CategoryPack,
  LastUpdate,
} = require('@models').system;

const {
  GfFeeGroup,
  GfFee,
  GfFeegroupsSectionsXref,
  GfBonusFeegroupsXref,
  GfSection,
  GfBonus,
} = require('@models').intranet;

const { modelToJson } = require('@utils/tools');

const {
  getAllEntities,
  createCatch,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const {
  respondBadRequest,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const _ = require('lodash');

const { Op } = require('sequelize');

const { updateDates } = require('@service/web/LastUpdateService');

let AllNormalizedTexts = {};
let AllNormalizedFees = {};
/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteCategoriesId = async function (id) {
  return await findAndDelete(id, Category);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getCategories = async function (query) {
  return await getAllEntities(query, Category);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getCategoriesId = async function (id) {
  return await findAndGet(id, Category, [
    {
      model: Pack,
      as: 'packs',
      include: {
        model: Definition,
        as: 'definitions',
        include: {
          model: Section,
          as: 'sections',
          include: {
            model: Fee,
            as: 'fees',
          },
        },
      },
    },
    {
      model: User,
      as: 'creator',
    },
  ]);
};

exports.getSectionsOfCategories = async function (query) {
  const categories = await getAllEntities(query, Category, undefined, [
    {
      model: Pack,
      as: 'packs',
      include: {
        model: Definition,
        as: 'definitions',
        include: {
          model: Section,
          as: 'sections',
          include: {
            model: Fee,
            as: 'fees',
          },
        },
      },
    },
    {
      model: User,
      as: 'creator',
    },
  ]);
  const feeIds = [];
  const response = categories.payload.data.map((category) => {
    const sections = [];
    category.packs.forEach((pack) => {
      pack.definitions.forEach((definition) => {
        definition.sections.forEach((section) => {
          if (
            typeof section.fees[0] !== 'undefined' &&
            !feeIds.includes(section.fees[0].id)
          ) {
            feeIds.push(section.fees[0].id);
            sections.push(section);
          }
        });
      });
    });

    return {
      id: category.id,
      alias: category.alias,
      code: category.code,
      sections: sections,
      creator_id: category.creator_id,
      createdAt: category.createdAt,
      deletedAt: category.deletedAt,
      updatedAt: category.updatedAt,
    };
  });

  return respondSuccess(response);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postCategories = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, Category);
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
exports.putCategoriesId = async function (id, body) {
  return await findAndUpdate(id, body, Category);
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
exports.getAllCategoriesInformation = async function (query) {
  const allCategoryInformation = await getAllEntities(
    query,
    Category,
    undefined,
    [
      {
        model: Pack,
        as: 'packs',
        include: {
          model: Definition,
          as: 'definitions',
          include: [
            {
              model: Section,
              as: 'sections',
            },
          ],
        },
      },
    ],
  );

  AllNormalizedTexts = await normalizeAllText();
  AllNormalizedFees = await normalizeAllFee();
  const normalizedCategories = [];

  for (const category of allCategoryInformation.payload.data) {
    const packs = await normalizePacks(category.packs);
    normalizedCategories.push({
      id: category.id,
      code: category.code,
      alias: category.alias,
      packs,
    });
  }
  allCategoryInformation.payload.data =
    changeByPriorities(normalizedCategories);

  return allCategoryInformation;
};

const changeByPriorities = (normalizedCategories) => {
  for (const category of normalizedCategories)
    category.packs = changePriorityOfPacks(category.packs);
  return normalizedCategories;
};

/**
 * get list of packs and reprioritize
 * @param {objec[]} packs
 * @returns {objec[]}
 */
const changePriorityOfPacks = (packs) => {
  return packs.sort((a, b) => {
    return b.definition.weight - a.definition.weight;
  });
};

const normalizePacks = async (packs) => {
  const returnPacks = [];

  for (const pack of packs) {
    let definition = pack.definitions[0];
    let languages = null;
    let sectionsInfo = null;
    if (definition) {
      // const texts = await Text.findAll({
      //   where: {
      //     locator_type: 'definition',
      //     locator_id: definition.id
      //   }
      // });
      languages = AllNormalizedTexts.definition[definition.id];
      sectionsInfo =
        definition.sections.length === 0
          ? null
          : await normalizeSectoins(definition.sections);
      definition = removeDefinitionExtraInfo(definition);
    }

    returnPacks.push({
      id: pack.id,
      alias: pack.alias,
      type: pack.type,
      discount: pack.discount,
      discount_type: pack.discount_type,
      total_price: _.isNull(sectionsInfo)
        ? null
        : calculatePriceWithTax(
            sectionsInfo.totalPrice,
            pack.tax,
            pack.discount,
            pack.discount_type,
          ),
      definition,
      languages,
      sections: _.isNull(sectionsInfo) ? null : sectionsInfo.returnSection,
    });
  }

  return returnPacks;
};

const calculatePriceWithTax = (price, tax, discount, discount_type) => {
  const numberPrice = Number(price);
  const taxOfPrice = parseFloat(numberPrice * (parseInt(tax) / 100));
  const discountValue =
    discount_type === 'fix'
      ? Number(discount)
      : parseFloat(numberPrice * (parseInt(discount) / 100));
  const sum = price + taxOfPrice - discountValue;
  return Number(sum.toFixed(2));
};

const normalizeSectoins = async (sections) => {
  const returnSection = [];
  let totalPrice = 0;
  for (const section of sections) {
    const fees = AllNormalizedFees[section.id];
    const price = await calculatePrice(section);
    totalPrice = parseFloat(totalPrice) + parseFloat(price);
    if (!_.isUndefined(fees)) {
      // const texts = await Text.findAll({
      //   where: {
      //     locator_type: 'section',
      //     locator_id: section.id
      //   }
      // })
      returnSection.push({
        alias: section.alias,
        code: section.code,
        discount: section.discount,
        discount_type: section.discount_type,
        tax: section.tax,
        tax_type: section.tax_type,
        discount_permanent: section.discount_permanent,
        icon: section.icon,
        price: _.isNull(price) ? 0 : price,
        languages: AllNormalizedTexts.section[section.id],
        fees,
      });
    }
  }

  return {
    returnSection,
    totalPrice,
  };
};

const calculatePrice = async (section) => {
  let price = 0;
  const fee = await Fee.findOne({
    where: {
      section_id: section.id,
    },
  });
  if (!_.isNull(fee)) {
    const gf_fee = await GfFee.findOne({
      where: {
        feeGroupId: fee.fee_group_id,
        status: 1,
      },
      order: [['fromDate', 'DESC']],
    });

    if (!_.isNull(gf_fee)) {
      price = parseFloat(gf_fee.baseQuote) - parseFloat(section.discount);
    }
  }

  return price.toFixed(4);
};

const removeDefinitionExtraInfo = (definition) => {
  return {
    id: definition.id,
    alias: definition.alias,
    weight: definition.weight,
    default: definition.default,
    published: definition.published,
    products_hide: definition.products_hide,
    features_hide: definition.features_hide,
    metadata: definition.metadata,
  };
};

exports.attachCategoriesToPack = async (body, creator_id) => {
  const { pack_id, category_ids } = body;

  const pack = await Pack.findByPk(pack_id);
  if (_.isNull(pack)) {
    return respondNotFound('pack not found');
  }

  const categoryIds = Object.values(category_ids);
  const insert = [];
  for (const category_id of categoryIds) {
    const category = await Category.findByPk(category_id);
    if (_.isNull(category)) {
      return respondNotFound('category not found');
    }
    const categoryPack = await CategoryPack.findOne({
      where: {
        category_id,
        pack_id,
      },
    });
    if (_.isNull(categoryPack)) {
      insert.push(category_id);
    }
  }

  await CategoryPack.destroy({
    where: {
      pack_id,
      category_id: {
        [Op.notIn]: categoryIds,
      },
    },
    force: true,
  });

  for (const category_id of insert) {
    await CategoryPack.create({
      category_id,
      pack_id,
      type: pack.type,
      creator_id,
    });
  }

  return respondSuccess('categories,attached to pack');
};

const normalizeAllText = async () => {
  const texts = await Text.findAll();
  const normalizedTexts = {
    definition: {},
    section: {},
    fee: {},
  };
  texts.forEach((text) => {
    if (_.isUndefined(normalizedTexts[text.locator_type][text.locator_id])) {
      normalizedTexts[text.locator_type][text.locator_id] = {};
      normalizedTexts[text.locator_type][text.locator_id][text.language] = {};
      normalizedTexts[text.locator_type][text.locator_id][text.language][
        text.locator
      ] = text.text;
    } else {
      if (
        _.isUndefined(
          normalizedTexts[text.locator_type][text.locator_id][text.language],
        )
      ) {
        normalizedTexts[text.locator_type][text.locator_id][text.language] = {};
        normalizedTexts[text.locator_type][text.locator_id][text.language][
          text.locator
        ] = text.text;
      } else {
        normalizedTexts[text.locator_type][text.locator_id][text.language][
          text.locator
        ] = text.text;
      }
    }
  });
  return normalizedTexts;
};

const normalizeAllFee = async () => {
  const normalizeFees = {};
  const allFees = await Fee.findAll({
    include: {
      model: GfFeeGroup,
      as: 'fee_group',
      where: {
        status: 1,
        active: 1,
      },
      include: [
        {
          model: GfSection,
          as: 'sections',
          required: false,
        },
        {
          model: GfBonus,
          as: 'bonuses',
          required: false,
        },
        {
          model: GfFee,
          as: 'gf_fees',
          required: false,
        },
      ],
    },
  });

  allFees.forEach((fee) => {
    const feeJson = modelToJson(fee);
    feeJson.languages = AllNormalizedTexts.fee[fee.id];
    if (_.isUndefined(normalizeFees[fee.section_id])) {
      normalizeFees[feeJson.section_id] = [];
      normalizeFees[feeJson.section_id].push(feeJson);
    } else {
      normalizeFees[feeJson.section_id].push(feeJson);
    }
  });

  return normalizeFees;
};

exports.getHomePageFees = async (query) => {
  const allCategoryInformation = await getAllEntities(
    query,
    Category,
    undefined,
    [
      {
        model: Pack,
        as: 'packs',
        include: {
          model: Definition,
          as: 'definitions',
          where: {
            home_page: true,
          },
          include: [
            {
              model: Section,
              as: 'sections',
            },
          ],
        },
      },
    ],
  );

  AllNormalizedTexts = await normalizeAllText();
  AllNormalizedFees = await normalizeAllFee();
  const normalizedCategories = [];

  for (const category of allCategoryInformation.payload.data) {
    const packs = await normalizePacks(category.packs);
    normalizedCategories.push({
      id: category.id,
      code: category.code,
      alias: category.alias,
      packs,
    });
  }
  return respondSuccess(normalizedCategories);
};

Category.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Category.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
