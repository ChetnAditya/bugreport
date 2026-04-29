import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CommentEditor } from './CommentEditor';
import { useUpdateComment, useDeleteComment } from '@/hooks/bugs/use-comments';
import type { Comment, Role } from '@/types/domain';

export function CommentItem({
  comment,
  currentUserId,
  currentRole,
}: {
  comment: Comment;
  currentUserId: string;
  currentRole: Role;
}) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateComment(comment.bugId, comment.id);
  const del = useDeleteComment(comment.bugId, comment.id);
  const isAuthor = comment.authorId === currentUserId;
  const canDelete = isAuthor || currentRole === 'SUPERADMIN';
  const canEdit = isAuthor;

  return (
    <article className="rounded-lg border border-default bg-surface p-4">
      <header className="flex items-center justify-between text-xs text-tertiary font-mono">
        <span>
          <strong className="text-secondary">{comment.author?.name ?? 'unknown'}</strong> ·{' '}
          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
        </span>
        {(canEdit || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Comment actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onSelect={() => setEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onSelect={async () => {
                    if (!confirm('Delete this comment?')) return;
                    try {
                      await del.mutateAsync();
                      toast.success('Comment deleted');
                    } catch {
                      toast.error('Could not delete');
                    }
                  }}
                  className="text-sev-critical"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>
      {editing ? (
        <div className="mt-3">
          <CommentEditor
            initial={comment.text}
            submitting={update.isPending}
            cta="Save"
            onCancel={() => setEditing(false)}
            onSubmit={async (text) => {
              try {
                await update.mutateAsync(text);
                toast.success('Comment updated');
                setEditing(false);
              } catch {
                toast.error('Could not update');
              }
            }}
          />
        </div>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-primary">{comment.text}</p>
      )}
    </article>
  );
}
