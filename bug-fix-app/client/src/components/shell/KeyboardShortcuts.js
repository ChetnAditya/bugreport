import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMe } from '@/hooks/use-auth';
export function KeyboardShortcuts() {
    const nav = useNavigate();
    const me = useMe();
    useEffect(() => {
        function onKey(e) {
            if (e.target instanceof HTMLElement) {
                const tag = e.target.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
                    return;
                }
            }
            if (e.key === 'c' && (me.data?.role === 'TESTER' || me.data?.role === 'SUPERADMIN')) {
                nav('/bugs/new');
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [me.data?.role, nav]);
    return null;
}
