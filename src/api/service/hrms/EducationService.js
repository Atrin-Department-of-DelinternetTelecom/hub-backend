'use strict';

const { EmployeeEducation, User, File } = require('@models').system;
const status = require('http-status');
const { respondBadRequest, isResponsePayload } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const path = require('path');
const fs = require('fs');
const config = require('@config');
const { saveSingleFile, downloadFile } = require('@utils/file-utils');

/**
 *
 * delete an education record by id
 *
 * id String id of table education that belongs to specific employee
 * returns Object
 **/
exports.deleteEducationsId = async function (id) {
  return await findAndDelete(id, EmployeeEducation);
};

/**
 * Your GET endpoint
 * get all educations record
 *
 * returns Object
 **/
exports.getEducations = async function (query) {
  return await getAllEntities(query, EmployeeEducation);
};

/**
 * Your GET endpoint
 * get all educations record that related by user by id of user
 *
 * id String id of user
 * returns Object
 **/
exports.getUserEducationsId = async function (id) {
  if (typeof id == 'undefined' || (await User.findByPk(id)) === null) {
    return {
      code: status.BAD_REQUEST,
      payload: {
        message: 'user id not found',
      },
    };
  }
  return await EmployeeEducation.findAll({
    where: {
      employee_id: id,
    },
  });
};

/**
 * Your GET endpoint
 * get single education record by id
 *
 * id String id of contact of employee
 * returns Object
 **/
exports.getEducationsId = async function (id) {
  return await findAndGet(id, EmployeeEducation);
};

/**
 *
 * add some education information to an employee or user
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postEducations = async function (body, proof_doc) {
  if (typeof proof_doc == 'undefined' || proof_doc === null) {
    return respondBadRequest('please upload document');
  }

  if (
    typeof body.employee_id == 'undefined' ||
    (await User.findByPk(body.employee_id)) === null
  ) {
    return respondBadRequest('user id not found');
  }

  const file_path = await saveSingleFile(
    proof_doc,
    config.get('index.FilesAndDirectories.EducationProofDoc'),
  );
  const file = await File.create({
    file: file_path,
    fileable_id: 0,
    fileable_type: 'proof education',
  });
  body.proof_doc_file_id = file.id;
  const newEducation = await EmployeeEducation.create(body);
  file.fileable_id = newEducation.id;
  await file.save();
  return respondCreated(newEducation);
};

/**
 *
 * update an education record by id
 *
 * id String id of table education that
 * belongs to specific employee
 * body Body  (optional)
 * returns Object
 **/
exports.putEducationsId = async function (id, body, proof_doc) {
  if (proof_doc) {
    const file_path = await saveSingleFile(
      proof_doc,
      config.get('index.FilesAndDirectories.EducationProofDoc'),
    );
    const file = await File.create({
      file: file_path,
      fileable_id: id,
      fileable_type: 'proof education',
    });
    body.proof_doc_file_id = file.id;
  }
  return findAndUpdate(id, body, EmployeeEducation);
};

exports.getEducationsProofDocId = async function (id) {
  const education = await findAndGet(
    id,
    EmployeeEducation,
    {
      model: File,
      as: 'proof_doc',
    },
    false,
    true,
  );
  return isResponsePayload(education)
    ? education
    : downloadFile(education.proof_doc);
};
