import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Lightbox } from './Lightbox';
export function ScreenshotGallery({ urls }) {
    const [openIndex, setOpenIndex] = useState(null);
    if (urls.length === 0)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("ul", { className: "grid grid-cols-3 gap-2 md:grid-cols-5", children: urls.map((u, i) => (_jsx("li", { children: _jsx("button", { type: "button", onClick: () => setOpenIndex(i), className: "block w-full", "aria-label": `Open screenshot ${i + 1}`, children: _jsx("img", { src: u, alt: `Screenshot ${i + 1}`, className: "h-24 w-full rounded-md object-cover border border-default", loading: "lazy" }) }) }, u))) }), openIndex !== null && (_jsx(Lightbox, { urls: urls, startIndex: openIndex, onClose: () => setOpenIndex(null) }))] }));
}
