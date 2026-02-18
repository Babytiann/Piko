import { useState } from 'react';
import type { ReactNode } from 'react';
import { View, Text } from 'tamagui';
import { Image } from 'expo-image';

import { API_HOST } from '@/common/config';

interface Props {
  url: string;
  isMe: boolean;
}

export default function MediaImage({ url, isMe }: Props): ReactNode {
  const [aspectRatio, setAspectRatio] = useState(1.5);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <View
        bg={isMe ? '$blue8' : '$gray5'}
        mb="$1"
        px="$3"
        py="$2"
        style={{ borderRadius: 12, alignItems: 'center' }}
      >
        <Text fontSize="$1" color={isMe ? '$blue3' : '$gray10'}>
          [图片加载失败]
        </Text>
      </View>
    );
  }

  return (
    <View
      mb="$1"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        aspectRatio,
        maxHeight: 260,
      }}
    >
      <Image
        source={{ uri: `${API_HOST}${url}` }}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        contentFit="cover"
        transition={200}
        onLoad={(e) => {
          const { width, height } = e.source;
          if (width && height) {
            setAspectRatio(Math.min(Math.max(width / height, 0.5), 2.5));
          }
        }}
        onError={() => setError(true)}
        placeholder={isMe ? '#1a6dcc' : '#d4d4d8'}
        placeholderContentFit="cover"
      />
    </View>
  );
}
