import { useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BugListFilter } from './use-bugs';
import type { BugStatus, Severity, Priority } from '@/types/domain';
import { useMe } from '@/hooks/use-auth';

const STATUS_VALUES: BugStatus[] = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'FIXED', 'VERIFIED', 'CLOSED'];
const SEVERITY_VALUES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const PRIORITY_VALUES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

function pick<T extends string>(value: string | null, allowed: readonly T[]): T | undefined {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

export function useBugFilters() {
  const [params, setParams] = useSearchParams();
  const me = useMe();
  const prevUserId = useRef(me.data?.id);

  useEffect(() => {
    if (me.data?.id && me.data.id !== prevUserId.current) {
      setParams(new URLSearchParams(), { replace: true });
      prevUserId.current = me.data.id;
    }
  }, [me.data?.id, setParams]);

  const filter = useMemo<BugListFilter>(() => {
    const page = Number(params.get('page') ?? 1);
    const limit = Number(params.get('limit') ?? 20);
    return {
      status: pick(params.get('status'), STATUS_VALUES),
      severity: pick(params.get('severity'), SEVERITY_VALUES),
      priority: pick(params.get('priority'), PRIORITY_VALUES),
      assigneeId: params.get('assigneeId') ?? undefined,
      q: params.get('q') ?? undefined,
      page: Number.isFinite(page) && page >= 1 ? page : 1,
      limit: Number.isFinite(limit) && limit >= 1 && limit <= 100 ? limit : 20,
    };
  }, [params]);

  function setFilter(next: Partial<BugListFilter>) {
    const merged: BugListFilter = { ...filter, ...next, page: next.page ?? 1 };
    const sp = new URLSearchParams();
    if (merged.status) sp.set('status', merged.status);
    if (merged.severity) sp.set('severity', merged.severity);
    if (merged.priority) sp.set('priority', merged.priority);
    if (merged.assigneeId) sp.set('assigneeId', merged.assigneeId);
    if (merged.q) sp.set('q', merged.q);
    if (merged.page && merged.page > 1) sp.set('page', String(merged.page));
    if (merged.limit && merged.limit !== 20) sp.set('limit', String(merged.limit));
    setParams(sp, { replace: false });
  }

  function clear() {
    setParams(new URLSearchParams(), { replace: false });
  }

  return { filter, setFilter, clear };
}