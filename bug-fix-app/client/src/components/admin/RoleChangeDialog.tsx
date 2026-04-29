import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useChangeRole } from '@/hooks/use-users';
import type { Role, User } from '@/types/domain';

const ROLES: Role[] = ['TESTER', 'DEVELOPER', 'ADMIN'];

export function RoleChangeDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [role, setRole] = useState<Role>(user?.role ?? 'TESTER');
  const change = useChangeRole();
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role — {user.name}</DialogTitle>
        </DialogHeader>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger aria-label="New role"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={change.isPending || role === user.role}
            onClick={async () => {
              try {
                await change.mutateAsync({ id: user.id, role });
                toast.success('Role updated');
                onOpenChange(false);
              } catch {
                toast.error('Could not update role');
              }
            }}
          >
            {change.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
