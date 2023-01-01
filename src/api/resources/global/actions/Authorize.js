//@ts-check
'use strict';

const { JWT_TYPE } = require('@api/constants/enum');
const { errors } = require('@api/http/http_errors');
const { AccessToken } = require('@api/models/global/global_access_token');
const {
  AccessTokenTag,
} = require('@api/models/global/global_access_token_tag');
const { get } = require('@config');
const Action = require('@lib/crud/Action');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const { compare } = require('bcrypt');
const jwt = require('jsonwebtoken');
const moment = require('moment');

module.exports = class Authorize extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{hours: number,username: string,password: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, { hours, username, password }) {
    const accessTokens = await AccessToken.findAll({
      where: { username },
      include: { model: AccessTokenTag },
    });
    if (accessTokens.length > 1) {
      throw new errors.Unauthorized('Multiple access tokens found.');
    }
    if (accessTokens.length === 0) {
      throw new errors.Unauthorized('Invalid username or password.');
    }

    const accessToken = accessTokens[0];
    const expire = moment().add(hours, 'hours').toISOString();

    if (!(await compare(password, accessToken.password))) {
      throw new errors.Unauthorized('Incorrect username or password.');
    }
    const token = jwt.sign(
      {
        expiresIn: expire,
        id: accessToken.id,
        username: accessToken.username,
        userId: accessToken.user_id,
        collaboratorId: accessToken.gf_collaborator_id,
        type: JWT_TYPE.ACCESS_TOKEN,
      },
      get('index.jwt.secret'),
      { expiresIn: `${Number(hours || 1)}h` },
    );

    await accessToken.update({ expire, token });

    return {
      id: accessToken.id,
      userId: accessToken.user_id,
      collaboratorId: accessToken.gf_collaborator_id,
      token,
      expiresIn: expire,
      config: {
        ...accessToken.config,
        tags: (accessToken.AccessTokenTags ?? []).map(
          ({ contract_tag_id }) => contract_tag_id,
        ),
      },
    };
  }

  fields() {
    return [
      new Text('username').required(),
      new Text('password').required(),
      new NumberField('hours').help('Expiration hours').default(1).required(),
    ];
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @param {Object} resource
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    const { security, ...swaggerConfig } = super.swaggerConfig(
      request,
      resource,
    );

    return swaggerConfig;
  }
};
