import { system } from '@models';
import { getDocumentId } from '@service/documents/DocumentService';
import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';

import {
  findAndDelete,
  findAndUpdate,
  findAllEntities,
} from '@utils/request-handler';
import {
  respondCreated,
  respondSuccessWithPagination,
  respondNotFound,
  respondSuccess,
  respondWithError,
} from '@utils/response';
const { LeaveRequest, User } = system;
import type { Query } from '@utils/controller-factory';
import moment from 'moment';

export const getLeaveRequests = async function (query: Query) {
  const { size, page } = query;

  const { rows, count } = await findAllEntities(
    query,
    LeaveRequest,
    undefined,
    [
      {
        model: User,
        as: 'user',
      },
    ],
    {
      nest: true,
      raw: true,
    },
  );

  for (const element of rows) {
    element.document = element.doc_id
      ? await getDocumentData(element.doc_id)
      : {};
  }
  return respondSuccessWithPagination(rows, count, size, page, query.url);
};

export const getLeaveRequestById = async function (id: number) {
  const leaveRequest = (
    await LeaveRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })
  )?.get({ plain: true });
  if (!leaveRequest)
    return respondNotFound(`leave request with id:${id} not found.`);

  leaveRequest.document = leaveRequest.doc_id
    ? await getDocumentData(leaveRequest.doc_id)
    : {};

  return respondCreated(leaveRequest);
};

export const getLeaveRequestsByUserId = async function (
  query: Query,
  userId: number,
) {
  const { size, page } = query;

  const user = await User.findByPk(userId);

  if (!user)
    return respondNotFound(`leave request with this user id not found`);

  const { rows, count } = await findAllEntities(
    query,
    LeaveRequest,
    {
      user_id: user.id,
    },
    [
      {
        model: User,
        as: 'user',
      },
    ],
    {
      nest: true,
      raw: true,
    },
  );

  for (const element of rows) {
    element.document = element.doc_id
      ? await getDocumentData(element.doc_id)
      : {};
  }

  return respondSuccessWithPagination(rows, count, size, page, query.url);
};

export const postLeaveRequest = async function (
  body: {
    status: string;
    description?: string;
    start_date?: Date;
    end_date?: Date;
    doc_id?: string;
    user_id?: number;
    vacations?: number;
  },
  creator_id: number,
) {
  const { status = 'pending-request' } = body;

  if (
    body.end_date &&
    body.start_date &&
    moment(body.start_date).diff(moment(body.end_date), 'days') > 1
  ) {
    throw new Error('End date cannot be beofre of the starting date.');
  }

  const doc = await DelinternetStorage.create(
    'Delinternet-Documents-LeaveRequest',
    creator_id,
  );

  const leaveRequestResponse = (
    await LeaveRequest.create({
      ...body,
      creator_id,
      doc_id: doc.id,
    })
  )?.get({ plain: true });

  const requester = await User.findByPk(body.user_id);

  if (!requester)
    return respondNotFound(`The user with id: ${body.user_id} was not found.`);

  leaveRequestResponse.user = requester;

  const document = doc ? await getDocumentData(doc.id) : {};
  leaveRequestResponse.document = document;

  return respondCreated(leaveRequestResponse);
};

export const postUserLeaveRequest = async function (
  body: {
    description?: string;
    start_date?: Date;
    end_date?: Date;
  },
  creator_id: number,
) {
  if (
    (body.start_date && moment(body.start_date).diff(moment(), 'days') <= 1) ||
    (body.end_date && moment(body.end_date).diff(moment(), 'days') <= 1)
  ) {
    throw new Error('Cannot create leaveing request for the times past.');
  }
  if (
    body.end_date &&
    body.start_date &&
    moment(body.start_date).diff(moment(body.end_date), 'days') > 1
  ) {
    throw new Error('End date cannot be beofre of the starting date.');
  }

  const doc = await DelinternetStorage.create(
    'Delinternet-Documents-LeaveRequest',
    creator_id,
  );

  const leaveRequestResponse = (
    await LeaveRequest.create({
      ...body,
      status: 'pending-request',
      user_id: creator_id,
      vacations: 0,
      creator_id,
      doc_id: doc.id,
    })
  )?.get({ plain: true });

  const requester = await User.findByPk(creator_id);

  if (!requester)
    return respondNotFound(`The user with id: ${creator_id} was not found.`);

  leaveRequestResponse.user = requester;

  return respondCreated(leaveRequestResponse);
};

export const deleteLeaveRequest = function (id: number) {
  return findAndDelete(id, LeaveRequest);
};

export const updateLeaveRequest = async function (
  id: number,
  body: {
    doc_id?: string;
    status?: string;
    creator_id?: number;
    user_id?: number;
    description?: string;
    start_date?: Date;
    end_date?: Date;
    vacations?: number;
  },
  creator_id: number,
) {
  const { status } = body;

  const leaveRequest = await LeaveRequest.findByPk(id);

  if (!leaveRequest)
    return respondNotFound(`Leave Request with the id=${id} was not found.`);

  if (
    leaveRequest.status == 'finished' ||
    leaveRequest.status == 'canceled-request'
  )
    throw new Error('this leave request is not editable');

  if (status == 'vacation-ended') {
    const doc = await DelinternetStorage.create(
      'Delinternet-Documents-LeaveRequest',
      creator_id,
    );
    body.creator_id = creator_id;
    body.doc_id = `del:${doc.id}`;
  }
  delete body.user_id;

  const docId = body.doc_id ?? leaveRequest.doc_id;

  await findAndUpdate(id, body, LeaveRequest);

  const updatedLeaveRequest = (
    await LeaveRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })
  )?.get({
    plain: true,
  });
  if (docId) updatedLeaveRequest.document = await getDocumentData(docId);
  else updatedLeaveRequest.document = {};

  return respondSuccess(updatedLeaveRequest);
};

export const updateUserLeaveRequest = async function (
  id: number,
  body: {
    description?: string;
    start_date?: Date;
    end_date?: Date;
  },
  creator_id: number,
) {
  const leaveRequest = await LeaveRequest.findByPk(id);

  if (!leaveRequest)
    return respondNotFound(`Leave Request with the id=${id} was not found.`);

  await findAndUpdate(id, body, LeaveRequest);

  const updatedLeaveRequest = (
    await LeaveRequest.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })
  )?.get({
    plain: true,
  });

  return respondSuccess(updatedLeaveRequest);
};

const getDocumentData = async (docId: number) => {
  const normalizedId = docId;

  const document = (await getDocumentId(normalizedId)).unwrap();

  return document;
};
