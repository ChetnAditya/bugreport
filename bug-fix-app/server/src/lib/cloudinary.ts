import { v2 as cloudinary } from 'cloudinary';
import { env } from '../env';
import { AppError } from './http-error';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw AppError.badRequest('Cloudinary credentials missing');
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function signUpload(folder: string): UploadSignature {
  ensureConfigured();
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    apiKey: env.CLOUDINARY_API_KEY!,
    timestamp,
    folder,
    signature,
  };
}
