'use strict';

module.exports = {
  slider: {
    desktop: {
      width: process.env.WS_DESKTOP_WIDTH,
      height: process.env.WS_DESKTOP_HEIGHT,
    },
    mobile: {
      width: process.env.WS_MOBILE_WIDTH,
      height: process.env.WS_MOBILE_HEIGHT,
    },
  },
  campaign: {
    desktop: {
      width: process.env.WC_DESKTOP_WIDTH,
      height: process.env.WC_DESKTOP_HEIGHT,
    },
    mobile: {
      width: process.env.WC_MOBILE_WIDTH,
      height: process.env.WC_MOBILE_HEIGHT,
    },
  },
  article: {
    large: {
      width: process.env.ARTICLE_LARGE_WIDTH,
      height: process.env.ARTICLE_LARGE_HEIGHT,
    },
    thumbnail: {
      width: process.env.ARTICLE_THUMB_WIDTH,
      height: process.env.ARTICLE_THUMB_HEIGHT,
    },
    mobile: {
      width: process.env.ARTICLE_MOBILE_WIDTH,
      height: process.env.ARTICLE_MOBILE_HEIGHT,
    },
  },
};
