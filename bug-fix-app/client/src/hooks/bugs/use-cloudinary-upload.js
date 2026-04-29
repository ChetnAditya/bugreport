import { useState } from 'react';
import { api } from '@/lib/api';
export function useCloudinaryUpload(bugId) {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    async function uploadFile(file) {
        setError(null);
        setProgress(0);
        const { data: sign } = await api.get(`/api/bugs/${bugId}/screenshots/sign`);
        const form = new FormData();
        form.set('file', file);
        form.set('api_key', sign.apiKey);
        form.set('timestamp', String(sign.timestamp));
        form.set('folder', sign.folder);
        form.set('signature', sign.signature);
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable)
                    setProgress(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const body = JSON.parse(xhr.responseText);
                    resolve(body.secure_url);
                }
                else {
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
