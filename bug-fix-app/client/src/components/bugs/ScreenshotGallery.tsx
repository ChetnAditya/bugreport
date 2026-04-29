import { useState } from 'react';
import { Lightbox } from './Lightbox';

export function ScreenshotGallery({ urls }: { urls: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (urls.length === 0) return null;
  return (
    <>
      <ul className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {urls.map((u, i) => (
          <li key={u}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="block w-full"
              aria-label={`Open screenshot ${i + 1}`}
            >
              <img src={u} alt={`Screenshot ${i + 1}`} className="h-24 w-full rounded-md object-cover border border-default" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {openIndex !== null && (
        <Lightbox urls={urls} startIndex={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
