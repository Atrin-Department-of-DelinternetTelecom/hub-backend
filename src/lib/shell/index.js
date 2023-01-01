// @ts-check
'use strict';

const sh = require('shelljs');

/**
 * The goal of this package is to provide a promisified api over shelljs api.
 * currently is not available in shelljs https://github.com/shelljs/shelljs/issues/2
 */

/**
 *
 * @param {string} cmd
 * @returns {Promise<string>}
 */
function exec(cmd) {
  return new Promise(function (resolve, reject) {
    // Execute the command, reject if we exit non-zero (i.e. error)
    sh.exec(cmd, { async: true }, function (code, stdout, stderr) {
      if (code != 0) return reject(new Error(stderr));
      return resolve(stdout);
    });
  });
}

module.exports = {
  exec,
  ls: sh.ls,
};
