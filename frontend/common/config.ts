import Constants from 'expo-constants';

function getDevServerHost(): string | null {
  // Expo Go
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  // Dev Client / EAS Update
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  return null;
}

function resolveApiHost(): string {
  const envHost = process.env.EXPO_PUBLIC_API_HOST;
  if (envHost) {
    return envHost;
  }

  if (__DEV__) {
    const host = getDevServerHost();
    if (host) {
      return `http://${host}:3000`;
    }
  }

  // 3. 兜底
  return 'http://localhost:3000';
}

export const API_HOST = resolveApiHost();
