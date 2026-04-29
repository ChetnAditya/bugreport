import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { Plus } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBugList } from '@/hooks/bugs/use-bugs';
import { useBugFilters } from '@/hooks/bugs/use-bug-filters';
import { FilterBar } from '@/components/bugs/FilterBar';
import { ActiveFilterChips } from '@/components/bugs/ActiveFilterChips';
import { Pagination } from '@/components/bugs/Pagination';
import { BugRow } from '@/components/bugs/BugRow';
import { EmptyState } from '@/components/common/EmptyState';
import { useMe } from '@/hooks/use-auth';
export function BugListPage() {
    const { filter, setFilter, clear } = useBugFilters();
    const list = useBugList({ ...filter, limit: filter.limit ?? 50 });
    const me = useMe();
    const canCreate = me.data?.role === 'TESTER' || me.data?.role === 'ADMIN';
    const parentRef = useRef(null);
    const rows = list.data?.data ?? [];
    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 56,
        overscan: 8,
    });
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "font-display text-xl", children: "Bugs" }), canCreate && (_jsx(Link, { to: "/bugs/new", children: _jsxs(Button, { size: "sm", className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), " New bug"] }) }))] }), _jsx(FilterBar, { filter: filter, onChange: setFilter }), _jsx(ActiveFilterChips, { filter: filter, onClear: clear, onRemove: (k) => setFilter({ [k]: undefined }) }), _jsx("div", { className: "rounded-xl border border-default bg-surface overflow-hidden", children: list.isLoading ? (_jsx("div", { className: "p-4 space-y-2", children: Array.from({ length: 6 }).map((_, i) => _jsx(Skeleton, { className: "h-12 w-full" }, i)) })) : rows.length === 0 ? (_jsx(EmptyState, { title: "No bugs match your filters", description: "Try clearing or relaxing the filters.", action: _jsx(Button, { variant: "outline", onClick: clear, children: "Clear filters" }) })) : (_jsx("div", { ref: parentRef, className: "max-h-[70vh] overflow-y-auto", children: _jsx("div", { style: { height: virtualizer.getTotalSize(), position: 'relative' }, children: virtualizer.getVirtualItems().map((v) => {
                            const bug = rows[v.index];
                            return (_jsx("div", { style: {
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    transform: `translateY(${v.start}px)`,
                                }, children: _jsx(BugRow, { bug: bug }) }, bug.id));
                        }) }) })) }), list.data && (_jsx(Pagination, { page: list.data.page, limit: list.data.limit, total: list.data.total, onPage: (p) => setFilter({ page: p }) }))] }));
}
