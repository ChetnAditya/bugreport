import { BugWizard } from '@/components/bugs/BugWizard';

export function BugCreatePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-xl">Report a bug</h1>
      <BugWizard />
    </div>
  );
}
