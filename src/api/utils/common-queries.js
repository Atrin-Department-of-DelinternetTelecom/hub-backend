'use strict';

const Sequelize = require('sequelize');

exports.isUniqueString = async function (value, col, model) {
  const finded = await model.findOne({
    where: Sequelize.where(
      Sequelize.fn('LOWER', Sequelize.col(col)),
      'LIKE',
      '%' + value.toLowerCase() + '%',
    ),
  });
  return finded === null ? true : false;
};
