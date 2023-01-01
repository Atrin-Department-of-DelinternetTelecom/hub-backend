/* eslint-disable @typescript-eslint/ban-types */
interface Field {
  /**
   * Type of the field value.
   *
   * @type {string}
   */
  type: string;

  /**
   * Display name of the field.
   *
   * @type {string}
   */
  name: string;

  /**
   * Corresponding database column name.
   *
   * @type {string}
   */
  attribute: string;

  /**
   * Set field help text.
   *
   * @param  {string} help
   * @return {Field}
   */
  help(help: string): Field;

  /**
   * Determine field is required or not.
   *
   * @param  {Boolean} required
   * @return {Field}
   */
  required(required?: boolean): Field;

  /**
   * Determine field is readonly or not.
   *
   * @param  {Boolean} readonly
   * @return {Field}
   */
  readonly(readonly?: boolean): Field;

  /**
   * Determine field can accept null.
   *
   * @param  {Boolean | Array} nullable
   * @param  {Array} nullValues
   * @return {Field}
   */
  nullable(nullable?: boolean | Array, nullValues?: Array): Field;

  /**
   * Determin if field used for primary key.
   *
   * @return {Field}
   */
  primaryKey(): Field;

  /**
   * Set the resolve callback.
   *
   * @param {Function} resolveCallback
   * @return {Field}
   */
  resolveUsing(resolveCallback: Function): Field;

  /**
   * Set the fill callback.
   *
   * @param {Function} fillCallback
   * @return {Field}
   */
  fillUsing(fillCallback: Function): Field;

  /**
   * Set authorize callback.
   *
   * @param  {Function|Boolean} canSeeCallback
   * @return {Field}
   */
  canSee(canSeeCallback?: Function | boolean): Field;

  /**
   * Set authorize callback.
   *
   * @param  {Function|Boolean} canSeeCallback
   * @return {Field}
   */
  cantSee(canSeeCallback?: Function | boolean): Field;

  /**
   * Set validation ruels for creation and updates.
   *
   * @param {array|string|Function} rules
   * @return {Field}
   */
  rules(rules: Array | string | Function): Field;

  /**
   * Set validation ruels for creation.
   *
   * @param {array|string|Function} rules
   * @return {Field}
   */
  creationRules(rules: Array | string | Function): Field;

  /**
   * Set validation ruels for updates.
   *
   * @param {array|string|Function} rules
   * @return {Field}
   */
  updateRules(rules: Array | string | Function): Field;
}

export const Field: Field;
