import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
export function Pagination({ page, limit, total, onPage, }) {
    const pages = Math.max(1, Math.ceil(total / limit));
    return (_jsxs("nav", { "aria-label": "Pagination", className: "flex items-center justify-between text-xs font-mono", children: [_jsxs("p", { className: "text-tertiary", children: ["Page ", page, " of ", pages, " \u2022 ", total, " bugs"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", disabled: page <= 1, onClick: () => onPage(page - 1), children: "Prev" }), _jsx(Button, { size: "sm", variant: "outline", disabled: page >= pages, onClick: () => onPage(page + 1), children: "Next" })] })] }));
}
