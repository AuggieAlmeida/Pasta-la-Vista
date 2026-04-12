import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { AppError } from './errors';

const endpoint = process.env.R2_ENDPOINT || (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);

// Inicializa S3 client para Cloudflare R2 (compatível com S3 API)
const r2 = endpoint && process.env.R2_ACCESS_KEY_ID
  ? new S3Client({
      region: 'auto',
      endpoint: endpoint,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

/**
 * Faz upload de uma imagem de produto para o Cloudflare R2.
 * - Redimensiona para 800x800 (mantendo proporção)
 * - Converte para WebP com qualidade 85
 * - Retorna a URL pública via CDN
 */
export async function uploadProductImage(
  buffer: Buffer,
  productId: string
): Promise<string> {
  if (!r2) {
    throw new AppError('Cloudflare R2 não configurado. Verifique R2_ENDPOINT.', 500);
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const cdnBaseUrl = process.env.CDN_BASE_URL || process.env.R2_PUBLIC_URL;

  if (!bucketName || !cdnBaseUrl) {
    throw new AppError('R2_BUCKET_NAME e CDN_BASE_URL (ou R2_PUBLIC_URL) são obrigatórios no .env', 500);
  }

  const key = `produtos/${productId}/${randomUUID()}.webp`;

  // Otimizar imagem: resize + WebP
  const optimized = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  // Verificar tamanho (< 100KB target)
  if (optimized.length > 500 * 1024) {
    // Re-tentar com qualidade menor se ficou grande demais
    const smallerBuffer = await sharp(buffer)
      .resize(600, 600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 70 })
      .toBuffer();

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: smallerBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000', // 1 ano de cache CDN
      })
    );
  } else {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: optimized,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      })
    );
  }

  return `${cdnBaseUrl}/${key}`;
}
