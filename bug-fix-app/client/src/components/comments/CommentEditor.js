import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
export function CommentEditor({ initial = '', submitting, onSubmit, onCancel, cta = 'Post comment', }) {
    const [text, setText] = useState(initial);
    return (_jsxs("form", { className: "space-y-2", onSubmit: (e) => {
            e.preventDefault();
            const trimmed = text.trim();
            if (!trimmed)
                return;
            onSubmit(trimmed);
        }, children: [_jsx(Textarea, { rows: 3, value: text, onChange: (e) => setText(e.target.value), "aria-label": "Comment text", placeholder: "Add a comment..." }), _jsxs("div", { className: "flex justify-end gap-2", children: [onCancel && (_jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: onCancel, children: "Cancel" })), _jsx(Button, { type: "submit", size: "sm", disabled: submitting || !text.trim(), children: submitting ? 'Posting…' : cta })] })] }));
}
