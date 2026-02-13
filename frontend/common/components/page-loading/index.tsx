import type { ReactNode } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export default function PageLoading(): ReactNode {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
