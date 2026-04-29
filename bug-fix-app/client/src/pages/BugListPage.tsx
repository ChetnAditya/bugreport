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
  const canCreate = me.data?.role === 'TESTER' || me.data?.role === 'SUPERADMIN';

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = list.data?.data ?? [];
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl">Bugs</h1>
        {canCreate && (
          <Link to="/bugs/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New bug
            </Button>
          </Link>
        )}
      </div>

      <FilterBar filter={filter} onChange={setFilter} />
      <ActiveFilterChips
        filter={filter}
        onClear={clear}
        onRemove={(k) => setFilter({ [k]: undefined })}
      />

      <div className="rounded-xl border border-default bg-surface overflow-hidden">
        {list.isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No bugs match your filters"
            description="Try clearing or relaxing the filters."
            action={<Button variant="outline" onClick={clear}>Clear filters</Button>}
          />
        ) : (
          <div ref={parentRef} className="max-h-[70vh] overflow-y-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((v) => {
                const bug = rows[v.index]!;
                return (
                  <div
                    key={bug.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${v.start}px)`,
                    }}
                  >
                    <BugRow bug={bug} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {list.data && (
        <Pagination
          page={list.data.page}
          limit={list.data.limit}
          total={list.data.total}
          onPage={(p) => setFilter({ page: p })}
        />
      )}
    </div>
  );
}
