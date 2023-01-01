'use strict';
const { EmployeeCertification, User, File } = require('@models').system;

const { saveSingleFile, downloadFile } = require('@utils/file-utils');

const {
  respondCreated,
  respondBadRequest,
  isResponsePayload,
} = require('@utils/response');

const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  getAllEntities,
} = require('@utils/request-handler');

const config = require('@config');

/**
 *
 * delete certification record by id
 *
 * id String id of certification of an employee
 * returns Object
 **/
exports.deleteCertificationsId = async function (id) {
  return findAndDelete(id, EmployeeCertification);
};

/**
 * Your GET endpoint
 * get all certifications
 *
 * returns Object
 **/
exports.getCertifications = async function (query) {
  return getAllEntities(query, EmployeeCertification);
};

/**
 * Your GET endpoint
 * get all user related certification record by id of user
 *
 * id String id of employee
 * returns Object
 **/
exports.getUserCertificationsId = async function (id) {
  if (typeof id == 'undefined' || (await User.findByPk(id)) === null) {
    return respondBadRequest('user not found');
  }
  return EmployeeCertification.findAll({
    where: {
      employee_id: id,
    },
  });
};

/**
 * Your GET endpoint
 * get simple certification record by id
 *
 * id String id of certification of an employee
 * returns Object
 **/
exports.getCertificationsId = async function (id) {
  return findAndGet(id, EmployeeCertification);
};

/**
 *
 * save a certifications of a user
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postCertifications = async function (body, proof_doc) {
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
    config.get('index.FilesAndDirectories.CertificationProofDoc'),
  );
  const file = await File.create({
    file: file_path,
    fileable_id: 0,
    fileable_type: 'proof certification',
  });
  body.proof_doc_file_id = file.id;
  const newCertification = await EmployeeCertification.create(body);
  file.fileable_id = newCertification.id;
  await file.save();
  return respondCreated(newCertification);
};

/**
 *
 * update certification record by id
 *
 * id String id of certification of an employee
 * body Body in this example we want to change
 * valid until property (optional)
 * returns Object
 **/
exports.putCertificationsId = async function (id, body, proof_doc) {
  if (proof_doc) {
    const file_path = await saveSingleFile(
      proof_doc,
      config.get('index.FilesAndDirectories.CertificationProofDoc'),
    );
    const file = await File.create({
      file: file_path,
      fileable_id: id,
      fileable_type: 'proof certification',
    });
    body.proof_doc_file_id = file.id;
  }
  return findAndUpdate(id, body, EmployeeCertification);
};

exports.getCertificationsProofDocId = async function (id) {
  const certification = await findAndGet(
    id,
    EmployeeCertification,
    {
      model: File,
      as: 'proof_doc',
    },
    false,
    true,
  );
  return isResponsePayload(certification)
    ? certification
    : downloadFile(certification.proof_doc);
};
