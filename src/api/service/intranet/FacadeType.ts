import { AnyModel } from '@api/models';

export type Block = (
  section: AnyModel,
  userId: number,
  comesFromTask?: boolean,
) => Promise<{ success: boolean; state: 'done' | 'pending' }>;

export type Resume = (
  section: AnyModel,
  userId: number,
) => Promise<{ success: boolean; state: 'done' | 'pending' }>;
