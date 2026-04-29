import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { availableTransitions, type AvailableTransition } from '@/lib/lifecycle-client';
import { AssigneeSelector } from './AssigneeSelector';
import { useTransitionBug } from '@/hooks/bugs/use-bugs';
import type { Bug, Priority, Role } from '@/types/domain';

const PRIORITIES: Priority[] = ['P1', 'P2', 'P3', 'P4'];

export function TransitionMenu({ bug, role, currentUserId, teamId }: { bug: Bug; role: Role; currentUserId: string; teamId?: string | null }) {
  const [pending, setPending] = useState<AvailableTransition | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [priority, setPriority] = useState<Priority | undefined>();
  const transition = useTransitionBug(bug.id);

  const options = availableTransitions({
    currentStatus: bug.status,
    role,
    isAssignee: bug.assigneeId === currentUserId,
  });

  if (options.length === 0) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            Change status <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((o) => (
            <DropdownMenuItem
              key={`${o.to}-${o.label}`}
              onSelect={async () => {
                if (o.needsAssignee || o.needsPriority) {
                  setPending(o);
                  return;
                }
                await runTransition(o);
              }}
            >
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {pending?.needsAssignee && (
              <div className="space-y-1">
                <span className="text-xs text-tertiary font-mono">Assignee</span>
                <AssigneeSelector value={assigneeId} onChange={setAssigneeId} teamId={teamId} />
              </div>
            )}
            {pending?.needsPriority && (
              <div className="space-y-1">
                <span className="text-xs text-tertiary font-mono">Priority</span>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger aria-label="Priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Cancel</Button>
            <Button
              disabled={
                (pending?.needsAssignee && !assigneeId) ||
                (pending?.needsPriority && !priority) ||
                transition.isPending
              }
              onClick={async () => {
                if (!pending) return;
                await runTransition(pending);
                setPending(null);
              }}
            >
              {transition.isPending ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  async function runTransition(o: AvailableTransition) {
    try {
      await transition.mutateAsync({
        to: o.to,
        ...(o.needsAssignee && { assigneeId }),
        ...(o.needsPriority && { priority }),
      });
      toast.success(`Status → ${o.to}`);
    } catch {
      toast.error('Transition rejected');
    }
  }
}
