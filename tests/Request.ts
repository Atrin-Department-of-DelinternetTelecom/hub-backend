import { allModels as models } from '@models';
import bcrypt from 'bcrypt';
import config from '@config';
import jwt from 'jsonwebtoken';
// TODO: fix later
const supertest = require('supertest'); // eslint-disable-line

const getTestUser = async () => {
  const userData = {
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    role: 'user',
    dni: ' ',
    email: 'user@local.test',
    password: generatePassword('testuser'),
  };

  const user = await models.User.findOne({ where: { email: userData.email } });

  return user || models.User.create(userData);
};

function generatePassword(plainPassword: string) {
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(plainPassword, salt);
}

export default class Request {
  /**
   * Create new supertest request.
   *
   * @return {SuperTest<supertest.Test>}
   */
  static makeRequest() {
    return supertest(globalThis.app);
  }

  static get(endpoint: string) {
    return this.makeRequest().get(endpoint).set('Accept', 'application/json');
  }

  static post(endpoint: string) {
    return this.makeRequest().post(endpoint).set('Accept', 'application/json');
  }

  static put(endpoint: string) {
    return this.makeRequest().put(endpoint).set('Accept', 'application/json');
  }

  static patch(endpoint: string) {
    return this.makeRequest().patch(endpoint).set('Accept', 'application/json');
  }

  static delete(endpoint: string) {
    return this.makeRequest()
      .delete(endpoint)
      .set('Accept', 'application/json');
  }

  /**
   * Get JWT token for given user.
   *
   * @param {Model|null} user
   * @return {Promise<string>}
   */
  static authorization = async (user = null) => {
    if (user === null) {
      user = await getTestUser();
    }

    return jwt.sign(
      { id: user.id, email: user.email },
      config.get('index.jwt.secret'),
      {},
    );
  };
}
