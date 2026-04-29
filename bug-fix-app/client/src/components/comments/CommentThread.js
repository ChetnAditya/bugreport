import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { CommentItem } from './CommentItem';
import { CommentEditor } from './CommentEditor';
import { useComments, useCreateComment } from '@/hooks/bugs/use-comments';
import { useMe } from '@/hooks/use-auth';
export function CommentThread({ bugId }) {
    const list = useComments(bugId);
    const create = useCreateComment(bugId);
    const me = useMe();
    if (!me.data)
        return null;
    return (_jsxs("section", { className: "space-y-4", "aria-label": "Comments", children: [_jsx("h2", { className: "font-display text-base", children: "Comments" }), list.isLoading ? (_jsx(Skeleton, { className: "h-24 w-full" })) : (_jsx("ul", { className: "space-y-3", children: (list.data ?? []).map((c) => (_jsx("li", { children: _jsx(CommentItem, { comment: c, currentUserId: me.data.id, currentRole: me.data.role }) }, c.id))) })), _jsx(CommentEditor, { submitting: create.isPending, onSubmit: async (text) => {
                    try {
                        await create.mutateAsync(text);
                        toast.success('Comment posted');
                    }
                    catch {
                        toast.error('Could not post');
                    }
                } })] }));
}
