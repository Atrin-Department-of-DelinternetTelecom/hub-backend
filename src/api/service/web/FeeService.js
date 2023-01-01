'use strict';

const { Section, Fee, User, Text, LastUpdate, Definition } =
  require('@models').system;

const { GfFeeGroup, GfFee, GfSection, GfBonus } = require('@models').intranet;

const {
  getAllEntities,
  findAndDelete,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const { respondBadRequest, respondCreated } = require('@utils/response');

const { updateDates } = require('@service/web/LastUpdateService');

/**
 *
 * delete a fee record by id
 *
 * id String
 * returns Object
 **/
exports.deleteFeesId = async function (id) {
  return await findAndDelete(id, Fee);
};

/**
 * Your GET endpoint
 * get all fees(information) record
 *
 * returns Object
 **/
exports.getFees = async function (query) {
  return await getAllEntities(query, Fee, undefined, [
    {
      model: Section,
      as: 'section',
      include: [
        {
          model: Definition,
          as: 'definition',
        },
        {
          model: Text,
          as: 'texts',
        },
      ],
    },
    {
      model: GfFeeGroup,
      as: 'fee_group',
      where: {
        active: 1,
      },
      include: [
        {
          model: GfFee,
          as: 'gf_fees',
        },
        {
          model: GfSection,
          as: 'sections',
        },
        {
          model: GfBonus,
          as: 'bonuses',
          required: false,
          // include:{
          //   all: true
          // }
        },
      ],
    },
    {
      model: Text,
      as: 'texts',
    },
    {
      model: User,
      as: 'creator',
    },
  ]).catch((err) => console.log(err));
};

/**
 * Your GET endpoint
 * get single fee record by id
 *
 * id String
 * returns Object
 **/
exports.getFeesId = async function (id) {
  return await findAndGet(id, Fee, [
    {
      model: Section,
      as: 'section',
    },
    {
      model: GfFeeGroup,
      as: 'fee_group',
      where: {
        active: 1,
      },
      include: [
        {
          model: GfFee,
          as: 'gf_fees',
        },
        {
          model: GfSection,
          as: 'sections',
          // include:{all:true}
        },
        {
          model: GfBonus,
          as: 'bonuses',
          required: false,
          // include:{all:true}
        },
      ],
    },
    {
      model: Text,
      as: 'texts',
    },
    {
      model: User,
      as: 'creator',
    },
  ]);
};

/**
 *
 * add a fee record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postFees = async function (body, creator_id) {
  if (
    body.section_id == undefined ||
    (await Section.findByPk(body.section_id)) === null
  ) {
    return respondBadRequest('section not found');
  }

  if (
    body.fee_group_id == undefined ||
    (await GfFeeGroup.findByPk(body.fee_group_id)) === null
  ) {
    return respondBadRequest('fee_group not found');
  }

  body.creator_id = creator_id;
  const newFee = await Fee.create(body);
  return await respondCreated(
    await Fee.findByPk(newFee.id, {
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: {
            model: GfFee,
            as: 'gf_fees',
          },
        },
        {
          model: Section,
          as: 'section',
        },
        {
          model: Text,
          as: 'texts',
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
 * update a fee record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected fee (optional)
 * returns Object
 **/
exports.putFeesId = async function (id, body) {
  return await findAndUpdate(id, body, Fee);
};

Fee.afterBulkUpdate((options) => {
  updateDates(LastUpdate);
});

Fee.afterCreate((instance, options) => {
  updateDates(LastUpdate);
});
