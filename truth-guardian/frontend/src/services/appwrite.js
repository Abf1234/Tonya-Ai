import { Account, Client, ID, Storage } from 'appwrite';

const readPublicSetting = (name) => (import.meta.env[name] || '').trim();

const endpoint = readPublicSetting('VITE_APPWRITE_ENDPOINT').replace(/\/+$/, '');
const projectId = readPublicSetting('VITE_APPWRITE_PROJECT_ID');
const databaseId = readPublicSetting('VITE_APPWRITE_DATABASE_ID');
const storageBucketId = readPublicSetting('VITE_APPWRITE_STORAGE_BUCKET_ID');
const hasValidEndpoint =
  /^https:\/\//i.test(endpoint) ||
  (import.meta.env.DEV && /^http:\/\/[^/]+/i.test(endpoint));

export const appwriteConfig = Object.freeze({
  endpoint,
  projectId,
  databaseId,
  storageBucketId,
});

export const isAppwriteConfigured = hasValidEndpoint && Boolean(projectId);
export const isAppwriteStorageConfigured = isAppwriteConfigured && Boolean(storageBucketId);

export const appwriteClient = new Client();
if (isAppwriteConfigured) {
  appwriteClient.setEndpoint(endpoint);
  appwriteClient.setProject(projectId);
}

export const account = isAppwriteConfigured ? new Account(appwriteClient) : null;
export const storage = isAppwriteStorageConfigured ? new Storage(appwriteClient) : null;

/**
 * Verify that the configured Appwrite project is reachable.
 * The startup check is intentionally a single, non-blocking request.
 *
 * @returns {Promise<boolean>} Whether the configured client responded.
 */
export async function pingAppwrite() {
  if (!isAppwriteConfigured) {
    return false;
  }

  await appwriteClient.ping();
  return true;
}

export { ID };

/**
 * Create a short-lived Appwrite JWT for a future protected Django API call.
 * The JWT is intentionally not persisted by the Truth Guardian frontend.
 */
export async function createAppwriteJwt() {
  if (!account) {
    throw new Error('Appwrite authentication is not configured.');
  }

  const result = await account.createJWT({ duration: 900 });
  if (typeof result?.jwt !== 'string' || !result.jwt) {
    throw new Error('Appwrite did not return a session token.');
  }
  return result.jwt;
}
