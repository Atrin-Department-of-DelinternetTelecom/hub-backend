import { URL, URLSearchParams } from 'url';

import Action from '@lib/crud/Action';
import { AnyModel } from '@api/models';
import { File } from '@api/utils/controller-factory';
import { Request } from 'express';
import { Resource } from '@lib/crud';
import Scope from '@lib/crud/Scope';

type UnknownRecord = Record<string, unknown>;
type Filter = { value: unknown; operator: unknown };
type Order = { order: string; direction: string };

export interface ResourceRequest extends Request {
  parsedQueryStrings: UnknownRecord;
  user: AnyModel;
  getOrParseQueryString: (
    query: string,
    callback: (params: URLSearchParams) => UnknownRecord,
  ) => UnknownRecord;
  fullUrl: () => string;
  parseUrl: () => URL;
  filled: (key: string) => boolean;
  has: (key: string) => boolean;
  hasFile: (key: string) => boolean;
  hasFilter: (key: string) => boolean;
  filter: (key: string) => Filter;
  filters: () => Filter[];
  hasOrder: (key: string) => boolean;
  order: (key: string) => Order;
  orders: () => Order[];
  all: () => UnknownRecord;
  input: (key: string, defaultValue: null | unknown) => unknown;
  queryString: (key: string, defaultValue: null | unknown) => unknown;
  route: (key: string, defaultValue: null | unknown) => unknown;
  file: (key: string) => File;
  //
  findResourceOrFail: (
    resourceId?: string | number | null,
  ) => Promise<Resource>;
  resource: (resourceId?: string | number | null) => Resource;
  newResource: (model: AnyModel) => Resource;
  findResource: (resourceId?: string | number | null) => AnyModel;
  findModelOrFail: (resourceId?: string | number | null) => Promise<AnyModel>;
  findModel: (resourceId?: string | number | null) => AnyModel;
  resourceId: () => string | number;
  action: () => Action;
  scope: () => Scope;
  isResourceRequest: () => boolean;
  isResourceActionRequest: () => boolean;
  isResourceIndexRequest: () => boolean;
  isResourceDetailRequest: () => boolean;
  isResourceCreateRequest: () => boolean;
  isResourceUpdateRequest: () => boolean;
  isResourceDeleteRequest: () => boolean;
  isMethod: (method: string) => boolean;
  userId: () => number;
}
