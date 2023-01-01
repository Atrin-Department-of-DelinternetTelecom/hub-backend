'use strict';

const helpers = require('src/api/utils/helpers.js');

/**
 * Test the value method.
 */
describe('helpers.value test', () => {
  it('work with simple value', () => {
    const value = 'Callback Working!';

    expect(helpers.value(value)).toEqual(value);
  });

  it('work with simple `function`', () => {
    const value = 'Callback Working!';
    const callableValue = () => value;

    expect(helpers.value(callableValue)).toEqual(value);
  });

  it('work with promise `function`', async () => {
    const value = 'Callback Working!';
    const promiseCallableValue = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          return resolve(value);
        }, 1000);
      });

    expect(await helpers.value(promiseCallableValue)).toEqual(value);
  });
});

/**
 * Test the with method.
 */
describe('helpers.with test', () => {
  it('work with normal parameter', () => {
    const value = 'Callback Working!';

    expect(helpers.with(value, ($value) => $value)).toEqual(value);
  });

  it('work with `function` parameter', () => {
    const value = 'Callback Working!';
    const callableValue = () => value;

    expect(helpers.with(callableValue, ($value) => $value)).toEqual(value);
  });

  it('work with `promise` parameter', async () => {
    const value = () => 'Callback Working!';
    const promiseCallableValue = () =>
      new Promise((resolve) => {
        setTimeout(() => {
          return resolve(value);
        }, 1000);
      });

    expect(
      await helpers.with(promiseCallableValue, ($value) => $value),
    ).toEqual(value);
  });
});

/**
 * Test the isFalse method.
 */
describe('helpers.isTruthy test', () => {
  it('work with `true`', () => {
    expect(helpers.isTruthy(true)).toEqual(true);
  });

  it('work with `positive number`', () => {
    expect(helpers.isTruthy(Math.random(0))).toEqual(true);
  });

  it('work with `array`', () => {
    expect(helpers.isTruthy(['test'])).toEqual(true);
  });

  it('work with `object`', () => {
    expect(helpers.isTruthy({ test })).toEqual(true);
  });

  it('work with `function`', () => {
    expect(helpers.isTruthy(() => true)).toEqual(true);
  });
});

/**
 * Test the isFalsy method.
 */
describe('helpers.isFalsy test', () => {
  it('work with `false` value', () => {
    expect(helpers.isFalsy(false)).toEqual(true);
  });

  it('work with `zero` value', () => {
    expect(helpers.isFalsy(0)).toEqual(true);
  });

  it('work with `negetive number` value', () => {
    expect(helpers.isFalsy(-Math.random())).toEqual(true);
  });

  it('work with `function`', () => {
    expect(helpers.isFalsy(() => false)).toEqual(true);
  });
});

/**
 * Test the when method.
 */
describe('helpers.when test', () => {
  it('work with `true` value', () => {
    const condition = true;
    const value = true;

    expect(helpers.when(condition, value, !value)).toEqual(value);
  });

  it('work with `integer` value', () => {
    const condition = Math.floor(Math.random() * 100 + 1);
    const value = true;

    expect(helpers.when(condition, value, !value)).toEqual(value);
  });

  it('work with `string` value', () => {
    const condition = Date.now();
    const value = true;

    expect(helpers.when(condition, value, !value)).toEqual(value);
  });

  it('work with simple `function`', () => {
    const condition = () => true;
    const value = true;

    expect(helpers.when(condition, value, !value)).toEqual(value);
  });

  it('work with promise `function`', async () => {
    const value = true;
    const condition = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
      });

    expect(await helpers.value(condition, value, !value)).toEqual(value);
  });
});

/**
 * Test the unless method.
 */
describe('helpers.when test', () => {
  it('work with `zero` value', () => {
    const condition = 0;
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });

  it('work with `minus` value', () => {
    const condition = -Math.floor(Math.random() * 100 + 1);
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });

  it('work with `empty` value', () => {
    const condition = '';
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });

  it('work with `false` value', () => {
    const condition = false;
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });

  it('work with `null` value', () => {
    const condition = null;
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });

  it('work with `NaN` value', () => {
    const condition = NaN;
    const value = true;

    expect(helpers.when(condition, !value, value)).toEqual(value);
  });
});
