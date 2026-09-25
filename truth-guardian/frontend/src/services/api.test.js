import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createAppwriteJwtMock } = vi.hoisted(() => ({
  createAppwriteJwtMock: vi.fn(),
}));

vi.mock('./appwrite', () => ({
  createAppwriteJwt: createAppwriteJwtMock,
}));

import api, { withAppwriteAuth } from './api';

describe('API Appwrite authentication interceptor', () => {
  beforeEach(() => {
    createAppwriteJwtMock.mockReset();
    createAppwriteJwtMock.mockResolvedValue('short-lived-jwt');
  });

  it('adds a short-lived bearer token only for opted-in requests', async () => {
    const handler = api.interceptors.request.handlers[0].fulfilled;
    const publicConfig = { headers: {} };
    const protectedConfig = withAppwriteAuth({ headers: {} });

    await handler(publicConfig);
    await handler(protectedConfig);

    expect(createAppwriteJwtMock).toHaveBeenCalledTimes(1);
    expect(publicConfig.headers.Authorization).toBeUndefined();
    expect(protectedConfig.headers.Authorization).toBe('Bearer short-lived-jwt');
  });
});
