import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request, Response } from 'express';
import { get as config } from '@config';

export default () => {
  const proxyMiddleware = createProxyMiddleware<Request, Response>({
    target: config('index.inventory.url'),
    changeOrigin: true,
  });

  return proxyMiddleware;
};
