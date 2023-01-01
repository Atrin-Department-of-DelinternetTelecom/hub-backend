'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
exports.getApp = (code) => {
  const apps = JSON.parse(
    fs.readFileSync(path.resolve('./src/config/intranet/applications.json')),
  );
  return _.get(apps, `${code}`, {});
};
