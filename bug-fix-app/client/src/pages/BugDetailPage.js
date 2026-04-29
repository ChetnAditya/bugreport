import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const { id } = useParams();
    const me = useMe();
    const bug = useBug(id);
    const del = useDeleteBug();
    const nav = useNavigate();
    if (bug.isLoading || !me.data) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-7 w-48" }), _jsx(Skeleton, { className: "h-40 w-full" })] }));
    }
    if (bug.isError || !bug.data) {
        return (_jsxs("div", { className: "text-secondary", children: ["Bug not found.", ' ', _jsx(Link, { to: "/bugs", className: "text-accent underline", children: "Back to list" })] }));
    }
    const isAdmin = me.data.role === 'ADMIN';
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Link, { to: "/bugs", className: "inline-flex items-center gap-1 text-xs text-tertiary hover:text-primary", children: [_jsx(ArrowLeft, { className: "h-3 w-3" }), " Back to bugs"] }), _jsxs("header", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-xl", children: bug.data.title }), _jsxs("p", { className: "text-xs text-tertiary font-mono", children: ["#", bug.data.id.slice(0, 8)] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(TransitionMenu, { bug: bug.data, role: me.data.role, currentUserId: me.data.id }), isAdmin && (_jsxs(Button, { variant: "outline", className: "gap-2 text-sev-critical", onClick: async () => {
                                    if (!confirm('Delete this bug? This cannot be undone.'))
                                        return;
                                    try {
                                        await del.mutateAsync(bug.data.id);
                                        toast.success('Bug deleted');
                                        nav('/bugs');
                                    }
                                    catch {
                                        toast.error('Could not delete');
                                    }
                                }, children: [_jsx(Trash2, { className: "h-4 w-4" }), " Delete"] }))] })] }), _jsxs("div", { className: "flex flex-col gap-4 lg:flex-row", children: [_jsx("div", { className: "flex-1 min-w-0", children: _jsx(BugTimeline, { bug: bug.data }) }), _jsx(BugMetaPanel, { bug: bug.data })] })] }));
}
