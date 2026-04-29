import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentItem } from './CommentItem';
import { CommentEditor } from './CommentEditor';
import { useComments, useCreateComment } from '@/hooks/bugs/use-comments';
import { useMe } from '@/hooks/use-auth';

export function CommentThread({ bugId }: { bugId: string }) {
  const list = useComments(bugId);
  const create = useCreateComment(bugId);
  const me = useMe();
  if (!me.data) return null;

  return (
    <section className="space-y-4" aria-label="Comments">
      <h2 className="font-display text-base">Comments</h2>
      {list.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-3">
          {(list.data ?? []).map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} currentUserId={me.data!.id} currentRole={me.data!.role} />
            </li>
          ))}
        </ul>
      )}
      <CommentEditor
        submitting={create.isPending}
        onSubmit={async (text) => {
          try {
            await create.mutateAsync(text);
            toast.success('Comment posted');
          } catch {
            toast.error('Could not post');
          }
        }}
      />
    </section>
  );
}
