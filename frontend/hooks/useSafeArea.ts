import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function useAppSafeArea() {
  const insets = useSafeAreaInsets();
  return {
    top: insets.top + 20,
    bottom: insets.bottom + 20,
    left: insets.left,
    right: insets.right,
  };
}
