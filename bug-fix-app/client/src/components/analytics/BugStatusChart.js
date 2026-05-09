import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
export function BugStatusChart({ data }) {
    const rows = Object.entries(data).map(([status, count]) => ({ status, count }));
    return (_jsxs("div", { className: "rounded-xl border border-default bg-surface p-5", children: [_jsx("h2", { className: "font-display text-base mb-3", children: "Bugs by status" }), _jsx("div", { className: "h-64", "aria-label": "Bar chart of bugs by status", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: rows, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgb(var(--border))" }), _jsx(XAxis, { dataKey: "status", stroke: "rgb(var(--text-tertiary))", fontSize: 11 }), _jsx(YAxis, { stroke: "rgb(var(--text-tertiary))", fontSize: 11, allowDecimals: false }), _jsx(Tooltip, { contentStyle: {
                                    background: 'rgb(var(--bg-elevated))',
                                    border: '1px solid rgb(var(--border))',
                                    color: 'rgb(var(--text-primary))',
                                    fontFamily: 'JetBrains Mono Variable',
                                    fontSize: 12,
                                } }), _jsx(Bar, { dataKey: "count", fill: "rgb(var(--accent))", radius: [4, 4, 0, 0] })] }) }) })] }));
}
