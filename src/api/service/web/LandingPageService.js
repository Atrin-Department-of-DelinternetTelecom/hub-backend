'use strict';

const { LandingPage, User } = require('@models').system;
const { Parser } = require('@json2csv/plainjs');
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const { Op, where } = require('sequelize');

/**
 *
 * add a order record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postLandingPageOrder = async function (body) {
  return createCatch(body, LandingPage);
};

/**
 * Your GET endpoint
 * get all orders(information) record
 *
 * returns Object
 **/
exports.getLandingPageOrder = async function (query) {
  return getAllEntities(query, LandingPage, {}, [
    {
      model: User,
      as: 'user_processed',
      require: true,
    },
  ]);
};

exports.exportReferrals = async function (landing) {
  const rows = await LandingPage.findAll({ where: { landing } });
  const referrals = {};

  for (const row of rows) {
    const count = rows.reduce(
      (count, item) => count + Number(item.referredBy(row)),
      0,
    );

    if (referrals[row.email] === undefined) {
      referrals[row.email] = { count, row };
    } else if (referrals[row.email].count < count) {
      referrals[row.email] = { count, row };
    }
  }

  return Object.values(referrals);
};

/**
 * Your GET endpoint
 * get single order record by id
 *
 * id String
 * returns Object
 **/
exports.getSingleLandingPageOrder = async function (id) {
  const response = await findAndGet(id, LandingPage);
  const landing = response.unwrap();

  const count = await LandingPage.count({
    where: {
      // to search referrals
      metadata: {
        [Op.like]: `%${landing.getMetadata().referralCode}%`,
      },
      // to filter self referrals
      id: {
        [Op.not]: landing.id,
      },
      phone: {
        [Op.not]: landing.phone,
      },
      email: {
        [Op.not]: landing.email,
      },
    },
  });

  landing.setDataValue('referredByCount', Number(count));

  return response.replace(landing);
};

/**
 *
 * update a order record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected order (optional)
 * returns Object
 **/
exports.putLandingPageOrdersId = async function (id, body, auth_user_id) {
  if (['rejected', 'checked'].includes(body.status)) {
    body.user_processed_id = auth_user_id;
  }

  return findAndUpdate(id, body, LandingPage);
};

/**
 *
 * delete a order record by id
 *
 * id String
 * returns Object
 **/
exports.deleteLandingPageOrdersId = async function (id) {
  return findAndDelete(id, LandingPage);
};
