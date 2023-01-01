import { JwtPayload } from 'jsonwebtoken';
import type { User } from '@models/global/global_users';

export type Authenticated = { user: User; payload: JwtPayload };

export type SecurityHandler = (
  url: URL,
  securityDefinition: any,
  scopes: string | string[],
) => Promise<Authenticated | void>;
