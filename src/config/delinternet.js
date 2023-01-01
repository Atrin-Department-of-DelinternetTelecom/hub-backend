'use strict';

module.exports = {
  urls: {
    pages: process.env.DELINTENRET_PAGES
      ? JSON.parse(process.env.DELINTENRET_PAGES)
      : {
          es: 'https://www.delinternet.com/es',
          ca: 'https://www.delinternet.com/ca',
          en: 'https://www.delinternet.com/en',
        },
    articles: process.env.DELINTENRET_ARTICLES
      ? JSON.parse(process.env.DELINTENRET_ARTICLES)
      : {
          es: 'https://www.delinternet.com/es/blog',
          ca: 'https://www.delinternet.com/ca/bloc',
          en: 'https://www.delinternet.com/en/bloc',
        },
    categories: process.env.DELINTENRET_CATEGORIES
      ? JSON.parse(process.env.DELINTENRET_CATEGORIES)
      : {
          es: 'https://www.delinternet.com/es/blog/categorias',
          ca: 'https://www.delinternet.com/ca/bloc/categories',
          en: 'https://www.delinternet.com/en/bloc/categories',
        },
    tags: process.env.DELINTENRET_TAGS
      ? JSON.parse(process.env.DELINTENRET_TAGS)
      : {
          es: 'https://www.delinternet.com/es/blog/etiquetas',
          ca: 'https://www.delinternet.com/ca/bloc/etiquetes',
          en: 'https://www.delinternet.com/en/bloc/etiquetes',
        },
  },

  bucketName: process.env.DELINTENRET_BUCKET ?? 'delinternet',
  signatures: process.env.DELINTENRET_SIGNATURE_PATH ?? 'signatures',
};
