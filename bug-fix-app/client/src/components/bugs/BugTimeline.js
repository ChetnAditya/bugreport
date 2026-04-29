import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ScreenshotGallery } from './ScreenshotGallery';
import { CommentThread } from '@/components/comments/CommentThread';
export function BugTimeline({ bug }) {
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("section", { className: "rounded-xl border border-default bg-surface p-5", children: [_jsx("h2", { className: "font-display text-base mb-2", children: "Description" }), _jsx("p", { className: "whitespace-pre-wrap text-sm text-secondary", children: bug.description })] }), _jsxs("section", { className: "rounded-xl border border-default bg-surface p-5", children: [_jsx("h2", { className: "font-display text-base mb-2", children: "Steps to reproduce" }), _jsx("pre", { className: "whitespace-pre-wrap font-mono text-xs text-secondary", children: bug.stepsToReproduce })] }), bug.screenshots.length > 0 && (_jsxs("section", { className: "rounded-xl border border-default bg-surface p-5", children: [_jsx("h2", { className: "font-display text-base mb-3", children: "Screenshots" }), _jsx(ScreenshotGallery, { urls: bug.screenshots })] })), _jsx(CommentThread, { bugId: bug.id })] }));
}
