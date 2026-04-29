import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { LayoutDashboard, Bug, Plus, BarChart3, Users, User } from 'lucide-react';
import { useMe } from '@/hooks/use-auth';

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const nav = useNavigate();
  const me = useMe();
  const isAdmin = me.data?.role === 'ADMIN';
  const canCreate = me.data?.role === 'ADMIN' || me.data?.role === 'TESTER';
  const go = (path: string) => {
    onOpenChange(false);
    nav(path);
  };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go('/dashboard')}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/bugs')}>
            <Bug className="mr-2 h-4 w-4" /> Bugs
          </CommandItem>
          <CommandItem onSelect={() => go('/profile')}>
            <User className="mr-2 h-4 w-4" /> Profile
          </CommandItem>
          {isAdmin && (
            <>
              <CommandItem onSelect={() => go('/analytics')}>
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </CommandItem>
              <CommandItem onSelect={() => go('/users')}>
                <Users className="mr-2 h-4 w-4" /> Users
              </CommandItem>
            </>
          )}
        </CommandGroup>
        {canCreate && (
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => go('/bugs/new')}>
              <Plus className="mr-2 h-4 w-4" /> New bug
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPaletteHotkey(setOpen: (v: boolean) => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);
}
