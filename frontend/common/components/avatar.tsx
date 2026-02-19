import { useState } from 'react';
import type { ReactNode } from 'react';
import { Image, View } from 'react-native';
import { Text } from 'tamagui';

import { API_HOST } from '@/common/config';

/** Resolve relative server paths (e.g. "/piko/...") to absolute URLs. */
function resolveUrl(url: string): string {
  return url.startsWith('/') ? `${API_HOST}${url}` : url;
}

interface Props {
  /** Remote image URL (optional). Falls back to initials when absent or on error. */
  url?: string;
  /** Single character shown when no image is available. */
  text: string;
  /** Background colour for the initials fallback. */
  color: string;
  /** Diameter in dp. Defaults to 50. */
  size?: number;
}

export default function Avatar({
  url,
  text,
  color,
  size = 50,
}: Props): ReactNode {
  const [hasFailed, setHasFailed] = useState(false);
  const radius = size / 2;
  console.log('url', url);
  console.log('resolveUrl', resolveUrl(url ?? ''));

  if (url && !hasFailed) {
    return (
      <Image
        source={{ uri: resolveUrl(url) }}
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          objectFit: 'cover',
        }}
        onError={() => setHasFailed(true)}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text color="white" fontSize={size * 0.4} fontWeight="600">
        {text}
      </Text>
    </View>
  );
}
