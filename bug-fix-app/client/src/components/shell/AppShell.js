import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { TopBar } from './TopBar';
import { SideNav } from './SideNav';
import { BottomNav } from './BottomNav';
import { SkipLink } from '@/components/common/SkipLink';
import { CommandPalette, useCommandPaletteHotkey } from './CommandPalette';
import { KeyboardShortcuts } from './KeyboardShortcuts';
export function AppShell({ children }) {
    const [paletteOpen, setPaletteOpen] = useState(false);
    useCommandPaletteHotkey(setPaletteOpen);
    return (_jsxs("div", { className: "min-h-screen flex flex-col", children: [_jsx(SkipLink, {}), _jsx(TopBar, { onSearch: () => setPaletteOpen(true) }), _jsxs("div", { className: "flex flex-1", children: [_jsx(SideNav, {}), _jsx("main", { id: "main", className: "relative flex-1 px-4 md:px-8 py-6 pb-20 md:pb-6 max-w-[1280px] w-full mx-auto", children: children })] }), _jsx(BottomNav, {}), _jsx(CommandPalette, { open: paletteOpen, onOpenChange: setPaletteOpen }), _jsx(KeyboardShortcuts, {})] }));
}
