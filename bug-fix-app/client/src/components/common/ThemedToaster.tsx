import { Toaster } from 'sonner';

export function ThemedToaster() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors
      closeButton
      toastOptions={{ duration: 4000 }}
    />
  );
}
