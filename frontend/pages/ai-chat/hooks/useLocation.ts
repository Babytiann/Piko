/**
 * 位置获取 —— 封装 expo-location 权限管理和位置请求。
 *
 * 核心逻辑：
 * - 首次调用：requestForegroundPermissionsAsync()
 * - 用户拒绝：记录状态，后续不再弹权限弹窗
 * - 无权限时返回 null
 * - 用户拒绝后可通过 requestPermissionAgain 引导用户去系统设置
 */

import { useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

interface LocationResult {
  latitude: number;
  longitude: number;
}

interface UseLocationReturn {
  /** 获取当前位置，返回 null 表示无法获取（权限拒绝/超时等） */
  getLocation: () => Promise<LocationResult | null>;
  /** 用户是否已经拒绝过位置权限 */
  wasDenied: () => boolean;
  /** 重置拒绝状态 */
  resetDenied: () => void;
  /** 引导用户去系统设置授权，返回后检查权限并获取位置 */
  requestPermissionAgain: () => Promise<LocationResult | null>;
}

export function useLocation(): UseLocationReturn {
  const deniedRef = useRef(false);

  const getLocation = async (): Promise<LocationResult | null> => {
    if (deniedRef.current) {
      return null;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        deniedRef.current = true;
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch (err) {
      console.error('[useLocation] 获取位置失败:', err);
      return null;
    }
  };

  const wasDenied = (): boolean => deniedRef.current;

  const resetDenied = (): void => {
    deniedRef.current = false;
  };

  const requestPermissionAgain =
    useCallback(async (): Promise<LocationResult | null> => {
      void Linking.openSettings();

      return new Promise((resolve) => {
        const handleAppState = async (state: AppStateStatus): Promise<void> => {
          if (state !== 'active') return;

          subscription.remove();

          const { status } = await Location.getForegroundPermissionsAsync();

          if (status !== 'granted') {
            resolve(null);
            return;
          }

          deniedRef.current = false;

          try {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          } catch (err) {
            console.error('[useLocation] 获取位置失败:', err);
            resolve(null);
          }
        };

        const subscription = AppState.addEventListener(
          'change',
          handleAppState,
        );
      });
    }, []);

  return { getLocation, wasDenied, resetDenied, requestPermissionAgain };
}
