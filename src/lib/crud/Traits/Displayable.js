'use strict';

module.exports = class {
  /**
   * Display field on the creation form.
   *
   * @type {Boolean}
   */
  displayOnCreationForm = true;

  /**
   * Display field on the edit form.
   *
   * @type {Boolean}
   */
  displayOnUpdatingForm = true;

  /**
   * Display field on the detail page.
   *
   * @type {Boolean}
   */
  displayOnDetailPage = true;

  /**
   * Display field on the table.
   *
   * @type {Boolean}
   */
  displayOnIndexPage = true;

  /**
   * Display field on the swagger api.
   *
   * @type {Boolean}
   */
  displayOnSwaggerApi = true;

  /**
   * Display field on the sequelize.
   *
   * @type {Boolean}
   */
  displayOnSequelizeModel = true;

  /**
   * Hide field on the creation form.
   *
   * @return {this}
   */
  hideWhenCreation(hideOnCreationForm = true) {
    this.displayOnCreationForm = !hideOnCreationForm;

    return this;
  }

  /**
   * Hide field on the edit form.
   *
   * @return {this}
   */
  hideWhenUpdating(hideOnUpdatingForm = true) {
    this.displayOnUpdatingForm = !hideOnUpdatingForm;

    return this;
  }

  /**
   * Hide field on the detail page.
   *
   * @return {this}
   */
  hideOnDetail(hideOnDetailPage = true) {
    this.displayOnDetailPage = !hideOnDetailPage;

    return this;
  }

  /**
   * Hide field on the table.
   *
   * @return {this}
   */
  hideOnIndex(hideOnIndexPage = true) {
    this.displayOnIndexPage = !hideOnIndexPage;

    return this;
  }

  /**
   * Hide field on the swagger ui.
   *
   * @return {this}
   */
  hideOnSwagger(hideOnSwaggerApi = true) {
    this.displayOnSwaggerApi = !hideOnSwaggerApi;

    return this;
  }

  /**
   * Hide field on the sequelize model.
   *
   * @return {this}
   */
  hideOnSequelize(hideOnSequelizeModel = true) {
    this.displayOnSequelizeModel = !hideOnSequelizeModel;

    return this;
  }

  /**
   * Hide field on the form.
   *
   * @return {this}
   */
  hideOnForms() {
    this.hideWhenCreation();
    this.hideWhenUpdating();

    return this;
  }

  /**
   * Display field only on forms.
   *
   * @return {this}
   */
  onlyOnForms() {
    this.hideOnDetail();
    this.hideOnIndex();
    // this.hideOnSwagger();
    this.hideOnSequelize();

    return this;
  }

  /**
   * Display field except on forms.
   *
   * @return {this}
   */
  exceptOnForms() {
    this.hideWhenCreation();
    this.hideWhenUpdating();

    return this;
  }

  /**
   * Display field only on detail page.
   *
   * @return {this}
   */
  onlyOnDetail() {
    this.hideOnForms();
    this.hideOnIndex();
    this.hideOnSwagger();
    this.hideOnSequelize();

    return this;
  }

  /**
   * Display field only on table.
   *
   * @return {this}
   */
  onlyOnIndex() {
    this.hideOnForms();
    this.hideOnDetail();
    this.hideOnSwagger();
    this.hideOnSequelize();

    return this;
  }

  /**
   * Display field only on swagger ui.
   *
   * @return {this}
   */
  onlyOnSwagger() {
    this.hideOnForms();
    this.hideOnDetail();
    this.hideOnIndex();
    this.hideOnSequelize();

    return this;
  }

  /**
   * Display field only on sequelize model.
   *
   * @return {this}
   */
  onlyOnSequelize() {
    this.hideOnForms();
    this.hideOnDetail();
    this.hideOnIndex();
    this.hideOnSwagger();

    return this;
  }

  /**
   * Display field only on forms.
   *
   * @return {this}
   */
  isDisplayOnForms() {
    this.hideOnForms();
    this.hideOnDetail();
    this.hideOnIndex();

    return this;
  }

  /**
   * Detect that field can dispaly on the creation form.
   *
   * @return {this}
   */
  displayWhenCreation() {
    return this.displayOnCreationForm === true;
  }

  /**
   * Detect that field can dispaly on the edit form.
   *
   * @return {this}
   */
  displayWhenUpdating() {
    return this.displayOnUpdatingForm === true;
  }

  /**
   * Detect that field can dispaly on the detail page.
   *
   * @return {this}
   */
  displayOnDetail() {
    return this.displayOnDetailPage === true;
  }

  /**
   * Detect that field can dispaly on the table.
   *
   * @return {this}
   */
  displayOnIndex() {
    return this.displayOnIndexPage === true;
  }

  /**
   * Detect that field can dispaly on the swagger ui.
   *
   * @return {this}
   */
  displayOnSwagger() {
    return this.displayOnSwaggerApi === true;
  }

  /**
   * Detect that field can dispaly on the sequelize model.
   *
   * @return {this}
   */
  displayOnSequelize() {
    return this.displayOnSequelizeModel === true;
  }

  /**
   * Detect that field can dispaly on the form.
   *
   * @return {this}
   */
  displayOnForms() {
    return this.displayWhenCreation() && this.displayWhenUpdating();
  }
};
