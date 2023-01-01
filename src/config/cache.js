'use strict';

module.exports = {
  default: process.env.CACHE || 's3',

  drivers: {
    array: {},
    static: {},

    file: {
      basePath: undefined,
      ns: undefined,
      ttl: 3600,
      extension: undefined,
    },

    s3: {
      bucket: process.env.S3_CACHE_BUCKET ?? 'cache',
      expiration: process.env.S3_CACHE_EXPIRATION ?? 30, // remove after on week
      client: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION ?? 'us',
        endpoint: process.env.S3_BASE_URL,
        forcePathStyle: process.env.S3_PATH_STYLE ?? true,
      },
    },

    redis: {
      url: process.env.REDIS_URL,
    },
  },
};
