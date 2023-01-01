'use strict';

module.exports = {
  /**
   * Default search engine.
   *
   * @type {string}
   */
  default: process.env.DEFAULT_SEARCH_ENGINE || 'meilisearch',

  /**
   * Engines configurations.
   */
  engines: {
    /**
     * The meilisearch config.
     */
    meilisearch: {
      host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
      apiKey: process.env.MEILISEARCH_KEY || 'masterKey',
    },
  },
};
