'use strict';

const { GfClient, GfContract, GfFeeGroup, GfFeegroupsSectionsXref } =
  require('@models').intranet;

const { respondBadRequest, respondSuccess } = require('@utils/response');

exports.getNieInternetClients = async function () {
  return respondSuccess(
    await GfClient.findAll({
      where: {
        uid: 90,
        status: 1,
        active: 1,
        documentTypeId: 10,
      },
      include: {
        model: GfContract,
        as: 'contracts',
        attributes: [],
        where: {
          state: 'active',
          status: 1,
        },
        include: {
          model: GfFeeGroup,
          as: 'fee_group',
          attributes: [],
          require: true,
          where: {
            status: 1,
            active: 1,
          },
          include: {
            model: GfFeegroupsSectionsXref,
            as: 'gf_sections',
            require: true,
            attributes: [],
            where: {
              sectionId: 7,
              status: 1,
            },
          },
        },
      },
    }),
  );
};

exports.getBusinessClient = async function () {
  return respondSuccess(
    await GfClient.findAll({
      where: {
        uid: 90,
        status: 1,
        active: 1,
      },
      attributes: ['id', 'name', 'emailAddress'],
      include: {
        model: GfContract,
        as: 'contracts',
        attributes: [],
        where: {
          state: 'active',
          status: 1,
        },
        include: {
          model: GfFeeGroup,
          as: 'fee_group',
          attributes: [],
          require: true,
          where: {
            status: 1,
            active: 1,
            id: 38,
          },
        },
      },
    }),
  );
};
