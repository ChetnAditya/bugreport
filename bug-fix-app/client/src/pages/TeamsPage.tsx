import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeams, useCreateTeam, useDeleteTeam } from '@/hooks/use-teams';
import type { Team } from '@/types/domain';

export function TeamsPage() {
  const navigate = useNavigate();
  const list = useTeams();
  const create = useCreateTeam();
  const remove = useDeleteTeam();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), description: description.trim() });
      toast.success('Team created');
      setName('');
      setDescription('');
      setShowForm(false);
    } catch {
      toast.error('Could not create team');
    }
  };

  const handleDelete = async (team: Team) => {
    if (!confirm(`Delete team "${team.name}"?`)) return;
    try {
      await remove.mutateAsync(team.id);
      toast.success('Team deleted');
    } catch {
      toast.error('Could not delete team');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl">Teams</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="mr-1 h-4 w-4" /> New team
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-xl border border-default bg-surface p-4 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name">Team name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Platform Team"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !name.trim()}>
              {create.isPending ? 'Creating…' : 'Create team'}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-default bg-surface">
        {list.isLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : list.data?.length === 0 ? (
          <p className="p-6 text-center text-tertiary">No teams yet.</p>
        ) : (
          <ul>
            {(list.data ?? []).map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between border-b border-default px-4 py-3 last:border-0"
              >
                <button
                  type="button"
                  className="flex-1 text-left hover:text-accent"
                  onClick={() => navigate(`/teams/${team.id}`)}
                >
                  <p className="font-display text-sm">{team.name}</p>
                  <p className="text-xs text-tertiary">
                    {team.description ?? team.slug}
                  </p>
                </button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(team)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-4 w-4 text-tertiary" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
