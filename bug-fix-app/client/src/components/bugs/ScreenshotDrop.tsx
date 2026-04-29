import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = { 'image/png': [], 'image/jpeg': [], 'image/webp': [] };

export interface PendingFile {
  id: string;
  file: File;
  preview: string;
}

export function ScreenshotDrop({
  files,
  onChange,
}: {
  files: PendingFile[];
  onChange: (next: PendingFile[]) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT,
    maxSize: MAX_BYTES,
    maxFiles: MAX,
    disabled: files.length >= MAX,
    onDrop: (accepted) => {
      const next: PendingFile[] = accepted.slice(0, MAX - files.length).map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}`,
        file: f,
        preview: URL.createObjectURL(f),
      }));
      onChange([...files, ...next]);
    },
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer items-center justify-center rounded-md border border-dashed border-default bg-surface p-6 text-secondary',
          isDragActive && 'border-accent text-accent',
          files.length >= MAX && 'cursor-not-allowed opacity-60',
        )}
        aria-label="Add screenshots"
      >
        <input {...getInputProps()} />
        <ImagePlus className="h-5 w-5 mr-2" aria-hidden />
        {files.length >= MAX
          ? `Limit reached (${MAX})`
          : isDragActive
            ? 'Drop the images here'
            : 'Drag & drop or click — png/jpeg/webp, max 5MB each, 5 total'}
      </div>
      {files.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 md:grid-cols-5">
          {files.map((f) => (
            <li key={f.id} className="relative">
              <img
                src={f.preview}
                alt={f.file.name}
                className="h-24 w-full rounded-md object-cover border border-default"
              />
              <button
                type="button"
                aria-label={`Remove ${f.file.name}`}
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                className="absolute right-1 top-1 rounded-md bg-base/80 p-1 text-tertiary hover:text-primary"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
