import axios, { AxiosError } from 'axios';
import { get as config } from '@config';
import to from 'await-to-js';
import { errors } from '@api/http/http_errors';

interface CheckUserExistsResponse {
  exists: boolean;
  userId?: string;
  email?: string;
  active?: boolean;
}

export default async function request(
  fiscalId: string,
): Promise<CheckUserExistsResponse> {
  if (!fiscalId) {
    throw new errors.BadRequest('fiscalId is required');
  }

  const endpoint = config('index.club.endpoint', 'http://localhost');
  const apiKey = config('index.club.apiKey', '');

  const url = new URL('/api/v2/auth/check-user-exists', endpoint).toString();

  const [err, res] = await to(
    axios.post<{
      data: {
        exists: boolean;
        userId?: string;
        email?: string;
        active?: boolean;
      };
    }>(
      url,
      { fiscalId },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      },
    ),
  );

  if (err) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status;
    const data = axiosErr.response?.data as any;
    const msg = data?.message || axiosErr.message;
    const code = data?.code;

    if (status === 400 && code === 'USER_NOT_FOUND') {
      return { exists: false };
    }

    console.error(`[Club][checkUserExists]: ${msg}`);

    if (status === 400) {
      throw new errors.BadRequest(msg);
    }
    throw new errors.InternalServerError(msg);
  }

  // ✅ Extract directly from res.data.data
  const { exists, userId, email, active } = res!.data.data;

  return { exists, userId, email, active };
}
