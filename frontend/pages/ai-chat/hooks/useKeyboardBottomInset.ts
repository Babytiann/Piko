import { useState, useEffect } from 'react';

import { Keyboard, type KeyboardEvent, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  TAB_BAR_CONTENT_HEIGHT,
  KEYBOARD_INSET_PADDING_BOTTOM_OFFSET,
} from '@/common/consts';

export default function useKeyboardBottomInset(): number {
  const insets = useSafeAreaInsets();
  const idleInset = insets.bottom + TAB_BAR_CONTENT_HEIGHT;
  const [bottomInset, setBottomInset] = useState(idleInset);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: KeyboardEvent) => {
      setBottomInset(
        e.endCoordinates.height + KEYBOARD_INSET_PADDING_BOTTOM_OFFSET,
      );
    };
    const onHide = () => {
      setBottomInset(idleInset);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [idleInset]);

  return bottomInset;
}
