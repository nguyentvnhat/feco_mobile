const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

if (!apiBaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_BASE_URL. Please set it in .env and restart Expo.');
}

export const env = {
  apiBaseUrl,
};
