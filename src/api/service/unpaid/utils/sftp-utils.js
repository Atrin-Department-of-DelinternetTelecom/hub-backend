const Client = require('ssh2-sftp-client');
const path = require('path');

async function fetchXmlFilesFromSftp(config) {
  const sftp = new Client();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      privateKey: config.privateKey,
    });

    const fileList = await sftp.list(config.remotePath || '/');
    const xmlFiles = fileList.filter((file) => file.name.endsWith('.xml'));

    const files = [];

    for (const file of xmlFiles) {
      const filePath = path.posix.join(config.remotePath || '/', file.name);
      const data = await sftp.get(filePath);
      files.push({
        filename: file.name,
        data,
      });
    }

    return files;
  } catch (err) {
    throw new Error(`SFTP fetch failed: ${err.message}`);
  } finally {
    sftp.end();
  }
}

module.exports = {
  fetchXmlFilesFromSftp,
};
