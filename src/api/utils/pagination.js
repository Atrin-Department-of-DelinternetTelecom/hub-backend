'use strict';

const config = require('@config');

// link of all page
const generateLinksAndPage = (total, size, url, current_page) => {
  const links = [];
  let page = 1;
  for (let index = 0; index < total; index += size, page += 1) {
    links.push({
      url: url + `?page=${page}`,
      lable: page.toString(),
      active: current_page == page ? true : false,
    });
  }
  return {
    links,
    lastPage: page - 1,
  };
};

// generate prev next and other link
const generateLink = (url, lastPage, current_page) => {
  return {
    first: url + `?page=${1}`,
    last: url + `?page=${lastPage}`,
    prev:
      current_page == 1 ? null : url + `?page=${parseInt(current_page) - 1}`,
    next:
      current_page == lastPage
        ? null
        : url + `?page=${parseInt(current_page) + 1}`,
  };
};

exports.getPagination = (page, size) => {
  const limit = size ? size : config.get('index.pagination.pageSize');
  const offset = page ? (page - 1) * limit : 0;

  return {
    limit,
    offset,
  };
};

exports.getPaginationParams = () => {
  return [
    {
      name: 'page',
      in: 'query',
      type: 'integer',
      minimum: 0,
      default: 0,
      required: false,
      description: 'Number of page',
    },
    {
      name: 'size',
      in: 'query',
      type: 'integer',
      minimum: 0,
      maximum: 50,
      default: 20,
      required: false,
      description: 'Size of every page',
    },
  ];
};

exports.getFilterParams = () => {
  return [
    {
      name: 'filter',
      in: 'query',
      type: 'string',
      description: 'Filter for current api',
    },
    {
      name: 'order',
      in: 'query',
      type: 'string',
      description: 'Order for current api',
    },
    {
      name: 'include',
      in: 'query',
      type: 'boolean',
      default: false,
      required: false,
      description: 'Include relations of entity',
    },
  ];
};

exports.getMetaAndLinks = (total, perPage, url, currentPage) => {
  return {
    meta: {
      current_page: currentPage,
      total,
    },
  };
};
