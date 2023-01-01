'use strict';

const Collection = require('./Collection');

module.exports = class FieldCollection extends Collection {
  /**
   * Filter items for filter.
   *
   * @param  {any} req
   * @return {this}
   */
  filterable(req) {
    const items = this.items.filter((field) => field.isFilterable(req));

    return new FieldCollection(items);
  }

  /**
   * Filter items for sort.
   *
   * @param  {any} req
   * @return {this}
   */
  sortable(req) {
    const items = this.items.filter((field) => field.isSortable(req));

    return new FieldCollection(items);
  }

  /**
   * Filter authorized fields.
   *
   * @param  {any} req
   * @return {this}
   */
  authorize(req) {
    const items = this.items.filter((field) => field.authorize(req));

    return new FieldCollection(items);
  }

  /**
   * Resolve fields for given request.
   *
   * @param  {Object} req
   * @return {this}
   */
  resolve(req, resource) {
    this.items.forEach((field) => field.resolve(req, resource));

    return this;
  }

  /**
   * Filter items for creation page.
   *
   * @return {this}
   */
  forCreation() {
    const items = this.items.filter((field) => field.displayWhenCreation());

    return new FieldCollection(items);
  }

  /**
   * Filter items for update page.
   *
   * @return {this}
   */
  forUpdating() {
    const items = this.items.filter((field) => field.displayWhenUpdating());

    return new FieldCollection(items);
  }

  /**
   * Filter items for table.
   *
   * @return {this}
   */
  forIndex() {
    const items = this.items.filter((field) => field.displayOnIndex());

    return new FieldCollection(items);
  }

  /**
   * Filter items for detail view.
   *
   * @return {this}
   */
  forDetail() {
    const items = this.items.filter((field) => field.displayOnDetail());

    return new FieldCollection(items);
  }

  /**
   * Filter items for swagger ui.
   *
   * @return {this}
   */
  forSwagger() {
    const items = this.items.filter(
      (field) => field.displayOnSwagger() && !field.isReadonly(),
    );

    return new FieldCollection(items);
  }

  /**
   * Filter items for sequelize model.
   *
   * @return {this}
   */
  forSequelize() {
    const items = this.items.filter((field) => field.displayOnSequelize());

    return new FieldCollection(items);
  }

  /**
   * Filter items applied as primary key.
   *
   * @return {this}
   */
  primaries() {
    const items = this.items.filter((field) => field.isPrimary());

    return new FieldCollection(items);
  }

  /**
   * Prepare fields for swagger and map to swager config
   *
   * @return {Object}
   */
  toSwaggerConfig() {
    return this.forSwagger()
      .map((field) => field.swaggerConfig())
      .all();
  }

  /**
   * Prepare field for sequelize model.
   *
   * @return {Object}
   */
  toSequelizeConfig() {
    const properties = {};

    // eslint-disable-next-line array-callback-return
    this.forSequelize().map((item) => {
      const config = item.sequelizeConfig();

      properties[config.name] = config;
      delete properties[config.name].name;
    });

    return properties;
  }
};
