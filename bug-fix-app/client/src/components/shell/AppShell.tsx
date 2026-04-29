import { useState } from 'react';
import type { PropsWithChildren } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { SkipLink } from '@/components/common/SkipLink';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';
import { KeyboardShortcuts } from './KeyboardShortcuts';

export function AppShell({ children }: PropsWithChildren) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  useCommandPaletteHotkey(setPaletteOpen);
  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <TopBar onSearch={() => setPaletteOpen(true)} />
      <div className="flex flex-1">
        <SideNav />
        <main
          id="main"
          className="relative flex-1 px-4 md:px-8 py-6 pb-20 md:pb-6 max-w-[1280px] w-full mx-auto"
        >
          {children}
        </main>
      </div>
      <BottomNav />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <KeyboardShortcuts />
    </div>
  );
}
