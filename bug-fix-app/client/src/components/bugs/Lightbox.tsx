import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function Lightbox({
  urls,
  startIndex,
  onClose,
}: {
  urls: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI((p) => Math.max(0, p - 1));
      if (e.key === 'ArrowRight') setI((p) => Math.min(urls.length - 1, p + 1));
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, urls.length]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 p-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute right-4 top-4 rounded-md bg-elevated p-2">
        <X className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Previous" onClick={() => setI((p) => Math.max(0, p - 1))} className="absolute left-4 rounded-md bg-elevated p-2 disabled:opacity-40" disabled={i === 0}>
        <ChevronLeft className="h-5 w-5" />
      </button>
      <img src={urls[i]} alt={`Screenshot ${i + 1}`} className="max-h-[85vh] max-w-[85vw] rounded-md border border-default" />
      <button type="button" aria-label="Next" onClick={() => setI((p) => Math.min(urls.length - 1, p + 1))} className="absolute right-4 rounded-md bg-elevated p-2 disabled:opacity-40" disabled={i === urls.length - 1}>
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
