import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bug, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/bugs/new', label: 'New', icon: Plus },
  { to: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Primary mobile"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-default bg-surface/95 backdrop-blur"
    >
      {items.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 py-2 text-[11px] min-h-[56px]',
              isActive ? 'text-accent' : 'text-secondary',
            )
          }
        >
          <i.icon className="h-5 w-5" aria-hidden />
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
