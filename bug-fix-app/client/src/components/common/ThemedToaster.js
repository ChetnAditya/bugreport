import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster } from 'sonner';
export function ThemedToaster() {
    return (_jsx(Toaster, { position: "bottom-right", theme: "dark", richColors: true, closeButton: true, toastOptions: { duration: 4000 } }));
}
