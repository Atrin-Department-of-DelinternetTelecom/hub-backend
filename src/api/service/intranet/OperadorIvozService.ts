import { get as config, isLocal } from '@config';

import { OperadorIvozService as factory } from '@del-internet/sdk-operadors';

const OperadorIvozService = new factory({
  token: config('index.operadors.key', ''),
  seed: config('index.operadors.seed', ''),
  readonly: config('index.operadors.readOnly', true),
  url: config('index.operadors.endpoint'),
  debug: isLocal(),
});

export { OperadorIvozService as default, OperadorIvozService };

export type User = {
  ddi: number;
  nif: string;
  maxCalls: number;
  maxInboundCalls: number;
  language: string;
  password: string;
  ring_time: number;
  ratingPlanGroupId: number;
  voicemail: boolean;
  email?: string;
};

export const updateOrCreate = async (user: User) => {
  const response = await OperadorIvozService.show(user.ddi);

  if (response.success) {
    return OperadorIvozService.update(user.ddi, user);
  }

  if (response.status === 404) {
    return OperadorIvozService.create(user);
  }

  return response;
};
