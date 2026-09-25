import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createAppwriteJwtMock } = vi.hoisted(() => ({
  createAppwriteJwtMock: vi.fn(),
}));

vi.mock('./appwrite', () => ({
  createAppwriteJwt: createAppwriteJwtMock,
}));

import api, { getApiErrorMessage, withAppwriteAuth } from './api';

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

describe('getApiErrorMessage', () => {
  it('prefers a specific validation field detail over the generic envelope message', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 'validation_error',
            message: 'The request could not be completed.',
            details: { url: ['The URL is not on the approved domain.'] },
          },
        },
      },
    };

    expect(getApiErrorMessage(error)).toBe('The URL is not on the approved domain.');
  });

  it('uses the envelope message when there is no field detail', () => {
    const error = { response: { data: { error: { code: 'x', message: 'Evidence upload is not available.' } } } };

    expect(getApiErrorMessage(error)).toBe('Evidence upload is not available.');
  });

  it('falls back instead of rendering an object or leaking a stack trace', () => {
    const nested = { response: { data: { detail: { stack: 'trace' } } } };

    expect(getApiErrorMessage(nested, 'Fallback.')).toBe('Fallback.');
    expect(getApiErrorMessage(new Error('ECONNREFUSED'), 'Fallback.')).toBe('Fallback.');
  });
});
