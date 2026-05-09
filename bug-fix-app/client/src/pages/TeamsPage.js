import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/use-teams';
export function TeamsPage() {
    const navigate = useNavigate();
    const list = useTeams();
    const create = useCreateTeam();
    const remove = useDeleteTeam();
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim())
            return;
        try {
            await create.mutateAsync({ name: name.trim(), description: description.trim() });
            toast.success('Team created');
            setName('');
            setDescription('');
            setShowForm(false);
        }
        catch {
            toast.error('Could not create team');
        }
    };
    const handleDelete = async (team) => {
        if (!confirm(`Delete team "${team.name}"?`))
            return;
        try {
            await remove.mutateAsync(team.id);
            toast.success('Team deleted');
        }
        catch {
            toast.error('Could not delete team');
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "font-display text-xl", children: "Teams" }), _jsxs(Button, { size: "sm", onClick: () => setShowForm((s) => !s), children: [_jsx(Plus, { className: "mr-1 h-4 w-4" }), " New team"] })] }), showForm && (_jsxs("form", { onSubmit: handleCreate, className: "rounded-xl border border-default bg-surface p-4 space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "name", children: "Team name" }), _jsx(Input, { id: "name", value: name, onChange: (e) => setName(e.target.value), placeholder: "e.g. Platform Team" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { htmlFor: "description", children: "Description" }), _jsx(Input, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Optional" })] }), _jsxs("div", { className: "flex gap-2 justify-end", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowForm(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: create.isPending || !name.trim(), children: create.isPending ? 'Creating…' : 'Create team' })] })] })), _jsx("div", { className: "rounded-xl border border-default bg-surface", children: list.isLoading ? (_jsx("div", { className: "p-4 space-y-2", children: [1, 2].map((i) => (_jsx(Skeleton, { className: "h-12 w-full" }, i))) })) : list.data?.length === 0 ? (_jsx("p", { className: "p-6 text-center text-tertiary", children: "No teams yet." })) : (_jsx("ul", { children: (list.data ?? []).map((team) => (_jsxs("li", { className: "flex items-center justify-between border-b border-default px-4 py-3 last:border-0", children: [_jsxs("button", { type: "button", className: "flex-1 text-left hover:text-accent", onClick: () => navigate(`/teams/${team.id}`), children: [_jsx("p", { className: "font-display text-sm", children: team.name }), _jsx("p", { className: "text-xs text-tertiary", children: team.description ?? team.slug })] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDelete(team), disabled: remove.isPending, children: _jsx(Trash2, { className: "h-4 w-4 text-tertiary" }) })] }, team.id))) })) })] }));
}
