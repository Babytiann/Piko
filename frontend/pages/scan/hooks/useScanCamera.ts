import { useRef, useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import {
  useCameraPermissions,
  type CameraCapturedPicture,
  type CameraView,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

interface UseScanCameraReturn {
  /** 相机 ref，绑定到 CameraView */
  cameraRef: React.RefObject<CameraView | null>;
  /** 是否有相机权限 */
  hasPermission: boolean;
  /** 权限是否还在加载 */
  isPermissionLoading: boolean;
  /** 拍照 */
  takePicture: () => Promise<CameraCapturedPicture | null>;
  /** 从相册选图 */
  pickFromLibrary: () => Promise<string | null>;
  /** 请求相机权限 */
  requestPermission: () => Promise<void>;
}

export function useScanCamera(): UseScanCameraReturn {
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestCameraPermission] = useCameraPermissions();
  const [hasPermission, setHasPermission] = useState(false);
  // 是否已经尝试过首次自动请求
  const hasAutoRequested = useRef(false);
  const isPermissionLoading = !permission;

  useEffect(() => {
    if (!permission) return;

    if (permission.granted) {
      setHasPermission(true);
      return;
    }

    // 首次进入且未授权 → 自动弹出系统权限弹窗
    if (!hasAutoRequested.current && permission.canAskAgain) {
      hasAutoRequested.current = true;
      void requestCameraPermission().then((result) => {
        setHasPermission(result.granted);
      });
      return;
    }

    setHasPermission(false);
  }, [permission, requestCameraPermission]);

  const requestPermission = async (): Promise<void> => {
    if (permission?.canAskAgain) {
      const result = await requestCameraPermission();
      setHasPermission(result.granted);
      if (!result.granted) {
        Alert.alert(
          '需要相机权限',
          '请在系统设置中允许 Piko 使用相机来拍照记账',
          [
            { text: '取消', style: 'cancel' },
            { text: '去设置', onPress: () => void Linking.openSettings() },
          ],
        );
      }
    } else {
      // 系统不再允许弹框 → 引导去设置
      Alert.alert(
        '需要相机权限',
        '请在系统设置中允许 Piko 使用相机来拍照记账',
        [
          { text: '取消', style: 'cancel' },
          { text: '去设置', onPress: () => void Linking.openSettings() },
        ],
      );
    }
  };

  const takePicture = async (): Promise<CameraCapturedPicture | null> => {
    if (!cameraRef.current) return null;

    const photo = await cameraRef.current.takePictureAsync({
      quality: 0.8,
      base64: true,
    });

    return photo ?? null;
  };

  const pickFromLibrary = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];

    // base64: true 已在 launchImageLibraryAsync 配置中启用
    if (asset.base64) return asset.base64;

    return null;
  };

  return {
    cameraRef,
    hasPermission,
    isPermissionLoading,
    takePicture,
    pickFromLibrary,
    requestPermission,
  };
}
