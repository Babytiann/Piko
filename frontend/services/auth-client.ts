import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import * as SecureStore from 'expo-secure-store';

import { API_HOST } from '@/common/config';

export const authClient = createAuthClient({
  baseURL: API_HOST,
  plugins: [
    expoClient({
      scheme: 'piko',
      storagePrefix: 'piko',
      storage: SecureStore,
    }),
  ],
});
