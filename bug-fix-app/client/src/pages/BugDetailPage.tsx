import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useBug, useDeleteBug } from '@/hooks/bugs/use-bugs';
import { useMe } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BugMetaPanel } from '@/components/bugs/BugMetaPanel';
import { BugTimeline } from '@/components/bugs/BugTimeline';
import { TransitionMenu } from '@/components/bugs/TransitionMenu';

export function BugDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const bug = useBug(id);
  const del = useDeleteBug();
  const nav = useNavigate();

  if (bug.isLoading || !me.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (bug.isError || !bug.data) {
    return (
      <div className="text-secondary">
        Bug not found.{' '}
        <Link to="/bugs" className="text-accent underline">Back to list</Link>
      </div>
    );
  }

  const isAdmin = me.data.role === 'ADMIN';

  return (
    <div className="space-y-4">
      <Link to="/bugs" className="inline-flex items-center gap-1 text-xs text-tertiary hover:text-primary">
        <ArrowLeft className="h-3 w-3" /> Back to bugs
      </Link>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl">{bug.data.title}</h1>
          <p className="text-xs text-tertiary font-mono">#{bug.data.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TransitionMenu bug={bug.data} role={me.data.role} currentUserId={me.data.id} />
          {isAdmin && (
            <Button
              variant="outline"
              className="gap-2 text-sev-critical"
              onClick={async () => {
                if (!confirm('Delete this bug? This cannot be undone.')) return;
                try {
                  await del.mutateAsync(bug.data!.id);
                  toast.success('Bug deleted');
                  nav('/bugs');
                } catch {
                  toast.error('Could not delete');
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </header>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1 min-w-0"><BugTimeline bug={bug.data} /></div>
        <BugMetaPanel bug={bug.data} />
      </div>
    </div>
  );
}
