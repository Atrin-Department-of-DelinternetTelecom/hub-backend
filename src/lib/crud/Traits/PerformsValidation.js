//@ts-check
'use strict';
const models = require('@models');
const niv = require('node-input-validator');
const { Op } = require('sequelize');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');

/**
 * Convert validation args into the sequelize where.
 *
 * @param {Array} args
 * @return {Object}
 */
const buildQueryFromArgs = (args = []) => {
  const where = {};
  let key = null;
  while (args.length > 1 || key !== null) {
    if (key === null) {
      key = args.shift();
      continue;
    }

    where[key] = { [Op.not]: args.shift() ?? null };
    key = null;
  }

  return where;
};

/**
 * Check if given id exists on table.
 *
 * @param {Object} Model
 * @param {Number} value
 * @param {Array} args
 * @return {Promise<Boolean>}
 */
const performExistsValidation = async (Model, id, args = []) => {
  const found = await Model.findByPk(id, {
    where: buildQueryFromArgs(args),
  });

  return found !== null;
};

/**
 * Check model existence by given id on the intranet database.
 * examples:
 * existsOnIntranet:GfClient
 * existsOnIntranet:GfClient,status,1 [will ignored where status = 1]
 */
niv.extend('existsOnIntranet', async ({ value, args }) => {
  const model = args.shift();

  return await performExistsValidation(models.intranet[model], value, args);
});

/**
 * Check model existence by given id on the moozaic database.
 * examples:
 * existsOnIntranet:GfClient
 * existsOnIntranet:GfClient,status,1 [will ignored where status = 1]
 */
niv.extend('existsOnMoozaic', async ({ value, args }) => {
  const model = args.shift();

  return await performExistsValidation(models.moozaic[model], value, args);
});

/**
 * Check model existence by given id on the system database.
 * examples:
 * existsOnIntranet:GfClient
 * existsOnIntranet:GfClient,status,1 [will ignored where status = 1]
 */
niv.extend('existsOnSystem', async ({ value, args }) => {
  const model = args.shift();

  return await performExistsValidation(models.system[model], value, args);
});

module.exports = class PerformsValidation {
  /**
   * Get the validation rules for a action request.
   *
   * @param {Object} request
   * @return {Promise}
   * @throws {error}
   */
  async validateForAction(request) {
    await this.validate(
      request,
      this.rulesForAction(request),
      this.attributesForAction(request),
    );
  }

  /**
   * Get the validation attributes for action request.
   *
   * @param {Object} request
   * @return {Object}
   */
  attributesForAction(request) {
    return request
      .action()
      .fieldCollection(request)
      .all()
      .filter((field) => !field.isReadonly())
      .reduce((attributes, field) => {
        return {
          ...attributes,
          [field.validationKey()]: field.name,
        };
      }, {});
  }

  /**
   * Get the validation rules for action request.

   * @param {Object} request
   * @return {Object}
   */
  rulesForAction(request) {
    return this.formatRules(
      request
        .action()
        .fieldCollection(request)
        .all()
        .filter((field) => !field.isReadonly())
        .map((field) => field.getRules(request)),
    );
  }

  /**
   * Get the validation rules for a resource creation request.
   *
   * @param {Object} request
   * @return {Promise}
   * @throws {error}
   */
  async validateForCreation(request) {
    await this.validate(
      request,
      this.rulesForCreation(request),
      this.attributesForCreation(request),
    );
  }

  /**
   * Get the validation attributes for a resource creation request.
   *
   * @param {Object} request
   * @return {Object}
   */
  attributesForCreation(request) {
    return request
      .resource()
      .fieldCollection(request)
      .forCreation()
      .all()
      .reduce((attributes, field) => {
        return {
          ...attributes,
          [field.validationKey()]: field.name,
        };
      }, {});
  }

  /**
   * Get the validation rules for a resource creation request.

   * @param {Object} request
   * @return {Object}
   */
  rulesForCreation(request) {
    return this.formatRules(
      request
        .resource()
        .fieldCollection(request)
        .forCreation()
        .all()
        .filter((field) => !field.isReadonly())
        .map((field) => field.getCreationRules(request)),
    );
  }

  /**
   * Get the validation rules for a resource update request.
   *
   * @param {Object} request
   * @return {Promise}
   * @throws {error}
   */
  async validateForUpdate(request) {
    await this.validate(
      request,
      this.rulesForUpdate(request),
      this.attributesForUpdate(request),
    );
  }

  /**
   * Get the validation attributes for a resource update request.
   *
   * @param {Object} request
   * @return {Object}
   */
  attributesForUpdate(request) {
    return request
      .resource()
      .fieldCollection(request)
      .forUpdating()
      .all()
      .reduce((attributes, field) => {
        return {
          ...attributes,
          [field.validationKey()]: field.name,
        };
      }, {});
  }

  /**
   * Get the validation rules for a resource update request.

   * @param {Object} request
   * @return {Object}
   */
  rulesForUpdate(request) {
    return this.formatRules(
      request
        .resource()
        .fieldCollection(request)
        .forUpdating()
        .all()
        .filter((field) => !field.isReadonly())
        .map((field) => field.getUpdateRules(request)),
    );
  }

  /**
   * Prepare rules to using by validator.
   *
   * @param {Array} rules
   * @return {Object}
   */
  formatRules(rules) {
    return rules.reduce((rules, fieldRules) => {
      for (const attribute in fieldRules) {
        rules[attribute] = this.parseRules(fieldRules[attribute], attribute);
      }

      return rules;
    }, {});
  }

  /**
   *	Check for function rules and convert them to string.

   * @param {Array} rules
   * @param {String} attribute
   * @return {Array}
   */
  parseRules(rules, attribute) {
    return rules.map((rule, index) => {
      if (typeof rule === 'string') return rule;

      // create new validation key and build custom rule
      const validationKey = `${attribute}CustomRule${index}`;

      niv.extend(validationKey, async ({ value }) => {
        let passed = true;
        const fails = (message) => {
          niv.addCustomMessages({
            [`${attribute}.${validationKey}`]: message,
          });

          passed = false;
        };

        // await for call the fail callback
        await rule(value, attribute, fails);

        return passed;
      });

      return validationKey;
    });
  }

  /**
   * Validate request by the given rules.
   *
   * @param {Object} request
   * @param {Object} rules
   */
  async validate(request, rules, attributes = {}) {
    // to validate by all rules
    niv.bailable(false);

    niv.extendMessages(this.messages());

    const validator = new niv.Validator(
      Object.assign(request.body, request.files),
      rules,
    );

    validator.niceNames(attributes);

    ValidationException.throwUnless(await validator.check(), validator.errors);
  }

  /**
   * Custom validation messages.
   *
   * @return {Object}
   */
  messages() {
    return {
      existsOnIntranet: ':attribute with id::value not found',
      existsOnMoozaic: ':attribute with id::value not found',
      existsOnSystem: ':attribute with id::value not found',
    };
  }
};
