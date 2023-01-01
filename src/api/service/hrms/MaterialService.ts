import { system } from '@models';
import {
  findAndDelete,
  findAndUpdate,
  findAllEntities,
} from '@utils/request-handler';
import config = require('@config');
import {
  respondCreated,
  respondSuccessWithPagination,
  respondNotFound,
} from '@utils/response';

import fileUtils = require('@utils/file-utils');
import { DelinternetStorage } from '@api/service/documents/storages/DelinternetStorage';
import { getDocumentId, reload } from '@service/documents/DocumentService';
import { URL } from 'url';
import type { File, Query } from '@utils/controller-factory';
const { Material, User } = system;

export const getMaterials = async function (query: Query, url: string) {
  const { size, page } = query;

  const { rows: _rows, count } = await findAllEntities(
    query,
    Material,
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

  const rows = _rows.map((item: { image: string }) => {
    const { image, ...rest } = item;
    if (image) {
      const itemUrl = new URL(url);
      itemUrl.pathname = image;
      return {
        ...rest,
        image: itemUrl.toString(),
      };
    } else {
      return {
        ...rest,
        image,
      };
    }
  });

  for (const element of rows) {
    const document = await getDocumentData(element.doc_id);
    if (document) {
      if (
        document.signed &&
        element.status != 'returned' &&
        element.status != 'rejected'
      ) {
        await findAndUpdate(element.id, { status: 'signed' }, Material);
        element.status = 'signed';
      }

      if (element.status == 'signed' && !document.signed) {
        await findAndUpdate(element.id, { status: 'pending' }, Material);
        element.status = 'pending';
      }

      element.document = document;
    } else element.document = {};
  }

  return respondSuccessWithPagination(rows, count, size, page, query.url);
};

export const getMaterialById = async function (id: number, url: string) {
  const material = (
    await Material.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
        },
      ],
    })
  )?.get({ plain: true });

  if (!material)
    return respondNotFound(`material borrow request with id:${id} not found.`);

  const itemUrl = new URL(url);
  itemUrl.pathname = material.image;
  material.image = itemUrl.toString();

  const document = await getDocumentData(material.doc_id);
  if (document) {
    if (
      document.signed &&
      material.status != 'returned' &&
      material.status != 'rejected'
    ) {
      await findAndUpdate(id, { status: 'signed' }, Material);
      material.status = 'signed';
    }

    if (material.status == 'signed' && !document.signed) {
      await findAndUpdate(material.id, { status: 'pending' }, Material);
      material.status = 'pending';
    }

    material.document = document;
  } else material.document = {};

  return respondCreated(material);
};

export const postMaterial = async function (
  body: {
    status: string;
    description?: string;
    receive_date?: Date;
    return_date?: Date;
    name: string;
    user_id: number;
    image_1?: string;
    image_2?: string;
    image_3?: string;
  },
  files: File,
  creator_id: number,
  url: URL,
) {
  const images = Object.values(files);

  if (images[0]) {
    const image_1 = await fileUtils.saveSingleFile(
      images[0],
      config.get('index.FilesAndDirectories.materialImage'),
      creator_id,
    );
    body.image_1 = image_1;
  }

  if (images[1]) {
    const image_2 = await fileUtils.saveSingleFile(
      images[1],
      config.get('index.FilesAndDirectories.materialImage'),
      creator_id,
    );
    body.image_2 = image_2;
  }

  if (images[2]) {
    const image_3 = await fileUtils.saveSingleFile(
      images[2],
      config.get('index.FilesAndDirectories.materialImage'),
      creator_id,
    );
    body.image_3 = image_3;
  }

  const doc = await DelinternetStorage.create(
    'Delinternet-Documents-MaterialDelivery',
    creator_id,
  );

  const user = await User.findByPk(body.user_id);
  if (!user)
    return respondNotFound(`user with id:${body.user_id} was not found.`);

  const material = await Material.create({
    ...body,
    creator_id,
    doc_id: doc.id,
  });

  const response = {
    ...material?.get({ plain: true }),
    user,
  };
  if (body.image_1) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = body.image_1;
    response.image = itemUrl.toString();
  }
  if (body.image_2) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = body.image_2;
    response.image = itemUrl.toString();
  }
  if (body.image_3) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = body.image_3;
    response.image = itemUrl.toString();
  }

  return respondCreated(response);
};

export const postUserMaterial = async function (
  body: {
    description?: string;
    receive_date?: Date;
    return_date?: Date;
    name: string;
    image?: string;
  },
  blobImage: File,
  creator_id: number,
  url: URL,
) {
  if (blobImage) {
    const image = await fileUtils.saveSingleFile(
      blobImage,
      config.get('index.FilesAndDirectories.materialImage'),
      creator_id,
    );
    body.image = image;
  }

  const user = await User.findByPk(creator_id);
  if (!user)
    return respondNotFound(`user with id:${creator_id} was not found.`);

  const material = await Material.create({
    ...body,
    user_id: creator_id,
    creator_id,
    status: 'pending',
  });

  const response = {
    ...material?.get({ plain: true }),
    user,
  };
  if (body.image) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = body.image;
    response.image = itemUrl.toString();
  }

  return respondCreated(response);
};

export const deleteMaterial = function (id: number) {
  return findAndDelete(id, Material);
};

export const updateMaterial = async function (
  id: number,
  body: {
    status?: string;
    description?: string;
    receive_date?: Date;
    return_date?: Date;
    name?: string;
    image?: string;
    user_id?: number;
  },
  userId: number,
  url: URL,
  file?: File,
) {
  const material = await Material.findByPk(id);
  if (!material)
    return respondNotFound(`material with id:${id} was not found.`);

  let updatedMaterial = material?.get({ plain: true });

  if (file) {
    body.image = await fileUtils.saveSingleFile(
      file,
      config.get('index.FilesAndDirectories.materialImage'),
      userId,
    );
  } else {
    body.image = material?.get({ plain: true }).image;
  }

  switch (material.status) {
    case 'pending':
      await findAndUpdate(id, body, Material);
      updatedMaterial = { ...updatedMaterial, ...body };
      break;
    case 'signed':
      await findAndUpdate(
        id,
        {
          return_date: body?.return_date,
          receive_date: body?.receive_date,
          status: body?.status,
        },
        Material,
      );
      updatedMaterial = {
        ...updatedMaterial,
        status: body.status,
        return_date: body.return_date,
        receive_date: body.receive_date,
      };
      break;

    default:
      break;
  }
  const user = await User.findByPk(updatedMaterial.user_id);
  if (!user)
    return respondNotFound(`user with id:${body.user_id} was not found.`);

  if (updatedMaterial.image) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = updatedMaterial.image;
    updatedMaterial.image = itemUrl.toString();
  } else {
    delete updatedMaterial.image;
  }
  updatedMaterial.user = user?.get({ plain: true });
  updatedMaterial.document = updatedMaterial.doc_id
    ? await getDocumentData(updatedMaterial.doc_id)
    : {};

  return respondCreated(updatedMaterial);
};

export const updateUserMaterial = async function (
  id: number,
  body: {
    description?: string;
    receive_date?: Date;
    return_date?: Date;
    name?: string;
    image?: string;
  },
  userId: number,
  url: URL,
  file?: File,
) {
  const material = await Material.findByPk(id);
  if (!material)
    return respondNotFound(`material with id:${id} was not found.`);

  let updatedMaterial = material?.get({ plain: true });

  if (file) {
    body.image = await fileUtils.saveSingleFile(
      file,
      config.get('index.FilesAndDirectories.materialImage'),
      userId,
    );
  } else {
    body.image = material?.get({ plain: true }).image;
  }

  await findAndUpdate(id, body, Material);
  updatedMaterial = { ...updatedMaterial, ...body };

  const user = await User.findByPk(updatedMaterial.user_id);
  if (!user) return respondNotFound(`user with id:${userId} was not found.`);

  if (updatedMaterial.image) {
    const itemUrl = new URL(url.toString());
    itemUrl.pathname = updatedMaterial.image;
    updatedMaterial.image = itemUrl.toString();
  } else {
    delete updatedMaterial.image;
  }
  updatedMaterial.user = user?.get({ plain: true });

  return respondCreated(updatedMaterial);
};

const getDocumentData = async (docId: number) => {
  const normalizedId = docId;

  const document = (await getDocumentId(normalizedId)).unwrap();
  await reload(`del:${docId}`);
  return document;
};
