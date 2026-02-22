import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// ---------------------------------------------------------------------------
// R2 配置 — 从环境变量读取
// ---------------------------------------------------------------------------

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ?? '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME ?? '';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? '';

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.warn(
    '[R2] Missing R2 credentials in env. Image upload will not work.',
  );
}

// ---------------------------------------------------------------------------
// S3 Client（指向 Cloudflare R2）
// ---------------------------------------------------------------------------

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 上传图片到 R2。
 *
 * @param buffer   图片原始数据
 * @param key      R2 object key，如 "expenses/clx123.jpg"
 * @param contentType  MIME 类型
 * @returns 公开访问 URL
 */
export async function uploadImage(
  buffer: Buffer,
  key: string,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return getPublicUrl(key);
}

/**
 * 删除 R2 上的对象。
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }),
  );
}

/**
 * 根据 key 返回公开访问 URL。
 */
export function getPublicUrl(key: string): string {
  // R2_PUBLIC_URL 应配置为自定义域名或 R2 公开访问 URL
  // 例如 "https://r2.yourdomain.com"
  return `${R2_PUBLIC_URL}/${key}`;
}
