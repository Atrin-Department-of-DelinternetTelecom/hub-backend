import { client } from '@lib/redis';

export interface Message {
  command: string;
  request_id: string;
  params: unknown[];
  device_id: number;
}

export interface NewDeviceMessage extends Message {
  device_ip: string;
  device_port: number;
  device_timeout: number;
  device_username: string;
  device_password: string;
}

export const Publisher = {
  publish: (channel: string, message: Message) => {
    return client.publish(channel, JSON.stringify(message));
  },
};
