'use strict';

const config = require('@config');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const JSZip = require('jszip');
const { File } = require('@models').system;
const { respondNotFound } = require('@utils/response');
const crypto = require('crypto');

const root = config.get('index.root');
const dirs = config.get('index.FilesAndDirectories');

const getFileDirectory = function (fileType) {
  const foundKey = findKey(dirs, fileType);
  if (foundKey == undefined) {
    return dirs.DefaultPath;
  }
  return dirs[foundKey];
};

const findKey = (object, value) => {
  return Object.keys(object).find((key) => object[key] === value);
};
exports.getFileExtension = function (file) {
  return /[.]/.exec(file.name) ? /[^.]+$/.exec(file.name) : undefined;
};

const getFileName = function (fileType, ext) {
  return `${fileType}-${Date.now()}.${ext}`;
};

exports.saveBufferFile = async function (file, fileType, extension) {
  const { root, FilesAndDirectories: dirs } = config;

  const fileName = getFileName(fileType, extension);
  const baseDirectory = getFileDirectory(fileType);

  const subdir = baseDirectory;

  const fileDir = path.join(dirs.uploads, subdir);
  await fse.ensureDir(fileDir);

  const filePath = path.join(fileDir, fileName);
  const absPath = path.join(root, filePath);

  await fs.promises.writeFile(absPath, file);
  return filePath;
};

/**
 * @deprecated Do not write to the file
 * @param {any} file
 * @param {any} fileType
 * @param {any=} id
 * @param {any=} name
 * @returns
 */
exports.saveSingleFile = async function (
  file,
  fileType,
  id = undefined,
  name = null,
) {
  const exts = exports.getFileExtension(file);
  const extension = exts.length > 0 ? exts[0] : undefined;
  if (extension == undefined) {
    return undefined;
  }

  let fileName = getFileName(fileType, extension);
  if (name) fileName = `${name}.${extension}`;
  const baseDirectory = getFileDirectory(fileType);

  let subdir = baseDirectory;
  if (id != undefined) {
    subdir = path.join(baseDirectory, id.toString());
  }

  const fileDir = path.join(dirs.uploads, subdir);
  await fse.ensureDir(fileDir);
  const filePath = path.join(fileDir, fileName);
  const absPath = path.join(root, filePath);

  file.mv(absPath);
  return filePath;
};

const fromDirSync = (startPath, filter, cb) => {
  if (!fs.existsSync(startPath)) {
    console.log('no dir ', startPath);
    return;
  }

  const files = fs.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDirSync(filename, filter, cb); //recurse
    } else if (filename.indexOf(filter) >= 0) {
      cb(filename);
    }
  }
};

exports.fromDirSync = fromDirSync;

exports.getDirectoriesSync = (source) => {
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => path.join(source, dirent.name));
};

/**
 * @deprecated Do not use it. (not following single responsibility)
 * @param {any} zipFile
 * @param {string} fileType
 * @param {import('@models').AnyModel} model
 * @param {string} column
 * @returns
 */
exports.extractAndSaveSingleFile = async function (
  zipFile,
  fileType,
  model,
  column,
) {
  const zip = await JSZip.loadAsync(zipFile.data);
  const files = Object.keys(zip.files);

  if (files.length <= 0) return null;

  const data = await zip.file(files[0]).async('nodebuffer');
  const fileExt = exports.getFileExtension({ name: files[0] });
  const filePath = await exports.saveBufferFile(data, fileType, fileExt[0]);
  const file = await File.create({
    fileable_id: model.id,
    fileable_type: fileType,
    file: filePath,
  });
  model[column] = file.id;
  return model.save();
};

exports.saveSingleFileOrExtractAndSave = async (
  file,
  fileType,
  model,
  column,
) => {
  const extention = exports.getFileExtension(file);
  if (extention[0] === 'zip') {
    exports.extractAndSaveSingleFile(file, fileType, model, column);
  } else {
    const file_path = await exports.saveSingleFile(file, fileType);
    const fileRecord = await File.create({
      file: file_path,
      fileable_id: model.id,
      fileable_type: fileType,
    });
    model[column] = fileRecord.id;
    model.save();
  }
};

/**
 * @deprecated Do not use it
 * @param {any} fileObject
 * @returns {string}
 */
exports.downloadFile = function (fileObject) {
  return fileObject
    ? fs.existsSync(path.resolve(config.get('index.root'), fileObject.file))
      ? path.resolve(config.get('index.root'), fileObject.file)
      : respondNotFound('file not found')
    : respondNotFound('file not found');
};

/**
 * create temporary file and delete after 1 min
 *
 * @deprecated see https://nodejs.org/dist/latest-v16.x/docs/api/fs.html#fspromisesmkdtempprefix-options
 * @param {string} savePath address of file that we want to save
 * @param {Buffer} file array buffer of file
 * @param {string} extension file extension pdf,png and ...
 */
exports.createTemporaryFile = (savePath, file, extension) => {
  // check directory exist
  fse.ensureDirSync(savePath);

  //try to save file in selected path(savePath) ant delete file after 1 min
  try {
    const fileName = crypto.randomBytes(10).toString('hex');
    const pathOfFile = path.join(savePath, `${fileName}.${extension}`);
    fs.writeFileSync(pathOfFile, file);
    setTimeout(() => fs.promises.rm(pathOfFile), 60 * 1000);
    return pathOfFile;
  } catch (error) {
    throw new Error('cannot write file');
  }
};
