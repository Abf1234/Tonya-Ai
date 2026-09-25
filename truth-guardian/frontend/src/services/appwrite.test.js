import { describe, expect, it, vi } from 'vitest';

const { clientMock, pingMock } = vi.hoisted(() => {
  const client = {
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis(),
    ping: vi.fn(),
  };

  return { clientMock: client, pingMock: client.ping };
});

vi.mock('appwrite', () => ({
  Account: function AccountMock() {
    return {};
  },
  Client: function ClientMock() {
    return clientMock;
  },
  ID: {},
  Storage: function StorageMock() {
    return {};
  },
}));

vi.stubEnv('VITE_APPWRITE_ENDPOINT', 'https://example.test/v1');
vi.stubEnv('VITE_APPWRITE_PROJECT_ID', 'project-1');

const { appwriteClient, appwriteConfig, isAppwriteConfigured, pingAppwrite } = await import('./appwrite');

describe('Appwrite client setup', () => {
  it('configures the client and pings once through the startup helper', async () => {
    expect(isAppwriteConfigured).toBe(true);
    expect(appwriteConfig.endpoint).toBe('https://example.test/v1');
    expect(appwriteConfig.projectId).toBe('project-1');
    expect(appwriteClient).toBe(clientMock);
    expect(clientMock.setEndpoint).toHaveBeenCalledWith('https://example.test/v1');
    expect(clientMock.setProject).toHaveBeenCalledWith('project-1');

    pingMock.mockResolvedValueOnce({});

    await expect(pingAppwrite()).resolves.toBe(true);
    expect(pingMock).toHaveBeenCalledTimes(1);
  });
});
