import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useDropzone } from 'react-dropzone';
import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
const MAX = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = { 'image/png': [], 'image/jpeg': [], 'image/webp': [] };
export function ScreenshotDrop({ files, onChange, }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: ACCEPT,
        maxSize: MAX_BYTES,
        maxFiles: MAX,
        disabled: files.length >= MAX,
        onDrop: (accepted) => {
            const next = accepted.slice(0, MAX - files.length).map((f) => ({
                id: `${f.name}-${f.size}-${Date.now()}`,
                file: f,
                preview: URL.createObjectURL(f),
            }));
            onChange([...files, ...next]);
        },
    });
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { ...getRootProps(), className: cn('flex cursor-pointer items-center justify-center rounded-md border border-dashed border-default bg-surface p-6 text-secondary', isDragActive && 'border-accent text-accent', files.length >= MAX && 'cursor-not-allowed opacity-60'), "aria-label": "Add screenshots", children: [_jsx("input", { ...getInputProps() }), _jsx(ImagePlus, { className: "h-5 w-5 mr-2", "aria-hidden": true }), files.length >= MAX
                        ? `Limit reached (${MAX})`
                        : isDragActive
                            ? 'Drop the images here'
                            : 'Drag & drop or click — png/jpeg/webp, max 5MB each, 5 total'] }), files.length > 0 && (_jsx("ul", { className: "grid grid-cols-3 gap-2 md:grid-cols-5", children: files.map((f) => (_jsxs("li", { className: "relative", children: [_jsx("img", { src: f.preview, alt: f.file.name, className: "h-24 w-full rounded-md object-cover border border-default" }), _jsx("button", { type: "button", "aria-label": `Remove ${f.file.name}`, onClick: () => onChange(files.filter((x) => x.id !== f.id)), className: "absolute right-1 top-1 rounded-md bg-base/80 p-1 text-tertiary hover:text-primary", children: _jsx(X, { className: "h-3 w-3" }) })] }, f.id))) }))] }));
}
