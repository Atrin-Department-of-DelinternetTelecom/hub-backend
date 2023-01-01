import { Request } from 'express';

export function getUrl(req: Request) {
  return new URL(req.protocol + '://' + req.get('host') + req.path);
}
