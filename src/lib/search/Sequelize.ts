import { AnyModel } from '@api/models';
import { Searchable } from '@del-internet/support-search';

export default class Sequelize implements Searchable {
  constructor(public model: AnyModel) {}

  /**
   * Get the index name for the model.
   */
  searchableAs(): string {
    return this.model.constructor.name;
  }

  /**
   * Get the primary key name for the search.
   */
  searchableKey(): string {
    return this.model.get(this.searchableKeyName());
  }

  /**
   * Get the primary key name for the search.
   */
  searchableKeyName(): string {
    return 'id';
  }

  /**
   * Get the indexable data object for the model.
   */
  toSearchableObject(): object {
    return typeof this.model.toSearchableObject === 'function'
      ? this.model.toSearchableObject()
      : this.model.get({ plain: true });
  }
}
