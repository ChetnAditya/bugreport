import { Bug, LogOut, Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/hooks/use-auth';

export function TopBar({ onSearch }: { onSearch?: () => void }) {
  const me = useMe();
  const logout = useLogout();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-default bg-surface/80 backdrop-blur">
      <div className="flex h-full items-center gap-3 px-4">
        <Bug className="h-5 w-5 text-accent" aria-hidden />
        <span className="font-display text-base">Field Report</span>
        <button
          type="button"
          onClick={onSearch}
          className="ml-auto flex h-9 items-center gap-2 rounded-md border border-default bg-base px-3 text-sm text-secondary hover:text-primary"
          aria-label="Search bugs"
        >
          <Search className="h-4 w-4" aria-hidden /> Search <kbd className="ml-2 text-xs">⌘K</kbd>
        </button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Profile"
          onClick={() => nav('/profile')}
        >
          <UserIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          onClick={async () => {
            await logout.mutateAsync();
            nav('/login');
          }}
          disabled={!me.data}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
