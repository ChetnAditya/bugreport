import { useState } from 'react';
import { api } from '@/lib/api';

interface SignResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

export function useCloudinaryUpload(bugId: string) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    setError(null);
    setProgress(0);
    const { data: sign } = await api.get<SignResponse>(`/api/bugs/${bugId}/screenshots/sign`);
    const form = new FormData();
    form.set('file', file);
    form.set('api_key', sign.apiKey);
    form.set('timestamp', String(sign.timestamp));
    form.set('folder', sign.folder);
    form.set('signature', sign.signature);

    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const body = JSON.parse(xhr.responseText) as { secure_url: string };
          resolve(body.secure_url);
        } else {
          setError('Upload failed');
          reject(new Error(xhr.statusText));
        }
      };
      xhr.onerror = () => {
        setError('Network error');
        reject(new Error('network'));
      };
      xhr.send(form);
    });
  }

  return { uploadFile, progress, error };
}
