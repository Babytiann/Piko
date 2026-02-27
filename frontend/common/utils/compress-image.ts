import * as ImageManipulator from 'expo-image-manipulator';
import { readAsStringAsync } from 'expo-file-system';

interface CompressResult {
  base64: string;
  uri: string;
}

const MAX_WIDTH = 800;
const JPEG_QUALITY = 0.6;

export async function compressImage(uri: string): Promise<CompressResult> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await readAsStringAsync(manipulated.uri, {
    encoding: 'base64',
  });

  return { base64, uri: manipulated.uri };
}
