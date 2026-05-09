import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { CommentEditor } from './CommentEditor';
import { useUpdateComment, useDeleteComment } from '@/hooks/bugs/use-comments';
export function CommentItem({ comment, currentUserId, currentRole, }) {
    const [editing, setEditing] = useState(false);
    const update = useUpdateComment(comment.bugId, comment.id);
    const del = useDeleteComment(comment.bugId, comment.id);
    const isAuthor = comment.authorId === currentUserId;
    const canDelete = isAuthor || currentRole === 'SUPERADMIN';
    const canEdit = isAuthor;
    return (_jsxs("article", { className: "rounded-lg border border-default bg-surface p-4", children: [_jsxs("header", { className: "flex items-center justify-between text-xs text-tertiary font-mono", children: [_jsxs("span", { children: [_jsx("strong", { className: "text-secondary", children: comment.author?.name ?? 'unknown' }), " \u00B7", ' ', formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })] }), (canEdit || canDelete) && (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "icon", "aria-label": "Comment actions", children: _jsx(MoreHorizontal, { className: "h-4 w-4" }) }) }), _jsxs(DropdownMenuContent, { align: "end", children: [canEdit && (_jsxs(DropdownMenuItem, { onSelect: () => setEditing(true), children: [_jsx(Pencil, { className: "h-4 w-4 mr-2" }), " Edit"] })), canDelete && (_jsxs(DropdownMenuItem, { onSelect: async () => {
                                            if (!confirm('Delete this comment?'))
                                                return;
                                            try {
                                                await del.mutateAsync();
                                                toast.success('Comment deleted');
                                            }
                                            catch {
                                                toast.error('Could not delete');
                                            }
                                        }, className: "text-sev-critical", children: [_jsx(Trash2, { className: "h-4 w-4 mr-2" }), " Delete"] }))] })] }))] }), editing ? (_jsx("div", { className: "mt-3", children: _jsx(CommentEditor, { initial: comment.text, submitting: update.isPending, cta: "Save", onCancel: () => setEditing(false), onSubmit: async (text) => {
                        try {
                            await update.mutateAsync(text);
                            toast.success('Comment updated');
                            setEditing(false);
                        }
                        catch {
                            toast.error('Could not update');
                        }
                    } }) })) : (_jsx("p", { className: "mt-2 whitespace-pre-wrap text-sm text-primary", children: comment.text }))] }));
}
