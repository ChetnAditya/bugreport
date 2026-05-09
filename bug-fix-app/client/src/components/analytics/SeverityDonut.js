import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
const COLORS = {
    LOW: 'rgb(var(--sev-low))',
    MEDIUM: 'rgb(var(--sev-med))',
    HIGH: 'rgb(var(--sev-high))',
    CRITICAL: 'rgb(var(--sev-critical))',
};
export function SeverityDonut({ data }) {
    const rows = Object.entries(data).map(([name, value]) => ({ name, value }));
    const total = rows.reduce((s, r) => s + r.value, 0);
    return (_jsxs("div", { className: "rounded-xl border border-default bg-surface p-5", children: [_jsx("h2", { className: "font-display text-base mb-3", children: "Severity mix" }), _jsx("div", { className: "h-64", "aria-label": `Donut chart, ${total} bugs total`, children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: rows, dataKey: "value", innerRadius: 48, outerRadius: 86, paddingAngle: 2, children: rows.map((r) => _jsx(Cell, { fill: COLORS[r.name] ?? '#fff' }, r.name)) }), _jsx(Legend, { verticalAlign: "bottom", wrapperStyle: { fontSize: 11, fontFamily: 'JetBrains Mono Variable' } }), _jsx(Tooltip, { contentStyle: {
                                    background: 'rgb(var(--bg-elevated))',
                                    border: '1px solid rgb(var(--border))',
                                    color: 'rgb(var(--text-primary))',
                                    fontSize: 12,
                                } })] }) }) })] }));
}
