const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const env = {
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''),
};
