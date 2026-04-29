import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScreenshotDrop, type PendingFile } from './ScreenshotDrop';
import { useCreateBug, useAddScreenshots } from '@/hooks/bugs/use-bugs';
import { useCloudinaryUpload } from '@/hooks/bugs/use-cloudinary-upload';
import type { Severity } from '@/types/domain';

const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const step1 = z.object({
  title: z.string().min(3, 'Min 3 characters').max(140),
  description: z.string().min(10, 'Min 10 characters').max(5000),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});
const step2 = z.object({
  stepsToReproduce: z.string().min(5, 'Min 5 characters').max(2000),
});

export function BugWizard() {
  const [step, setStep] = useState(1);
  const [vals, setVals] = useState<{
    title?: string;
    description?: string;
    severity?: Severity;
    stepsToReproduce?: string;
  }>({});
  const [files, setFiles] = useState<PendingFile[]>([]);
  const create = useCreateBug();
  const nav = useNavigate();
  const [createdBugId, setCreatedBugId] = useState<string | null>(null);
  const upload = useCloudinaryUpload(createdBugId ?? 'pending');
  const attach = useAddScreenshots(createdBugId ?? 'pending');

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-xs font-mono" aria-label="Steps">
        {[1, 2, 3].map((s) => (
          <li
            key={s}
            className={
              s === step
                ? 'rounded-md bg-accent px-2 py-1 text-base font-semibold'
                : 'rounded-md border border-default px-2 py-1 text-tertiary'
            }
          >
            Step {s}
          </li>
        ))}
      </ol>

      {step === 1 && (
        <Step1
          defaults={vals}
          onNext={(v) => {
            setVals({ ...vals, ...v });
            setStep(2);
          }}
        />
      )}
      {step === 2 && (
        <Step2
          defaults={vals}
          onBack={() => setStep(1)}
          onNext={(v) => {
            setVals({ ...vals, ...v });
            setStep(3);
          }}
        />
      )}
      {step === 3 && (
        <Step3
          files={files}
          setFiles={setFiles}
          onBack={() => setStep(2)}
          onSubmit={async () => {
            try {
              const bug = await create.mutateAsync({
                title: vals.title!,
                description: vals.description!,
                stepsToReproduce: vals.stepsToReproduce!,
                severity: vals.severity!,
              });
              setCreatedBugId(bug.id);
              if (files.length > 0) {
                const urls: string[] = [];
                for (const f of files) urls.push(await upload.uploadFile(f.file));
                await attach.mutateAsync(urls);
              }
              toast.success('Bug submitted');
              nav(`/bugs/${bug.id}`);
            } catch {
              toast.error('Could not submit bug');
            }
          }}
          submitting={create.isPending}
        />
      )}
    </div>
  );
}

function Step1({
  defaults,
  onNext,
}: {
  defaults: { title?: string; description?: string; severity?: Severity };
  onNext: (v: { title: string; description: string; severity: Severity }) => void;
}) {
  type V = z.infer<typeof step1>;
  const {
    register, handleSubmit, setValue, watch,
    formState: { errors },
  } = useForm<V>({ resolver: zodResolver(step1), defaultValues: defaults });
  const sev = watch('severity');
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register('title')} aria-invalid={!!errors.title} />
        {errors.title && <p role="alert" className="text-xs text-sev-critical">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} {...register('description')} aria-invalid={!!errors.description} />
        {errors.description && <p role="alert" className="text-xs text-sev-critical">{errors.description.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="severity">Severity</Label>
        <Select value={sev} onValueChange={(v) => setValue('severity', v as Severity)}>
          <SelectTrigger id="severity" aria-label="Severity">
            <SelectValue placeholder="Choose severity" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {errors.severity && <p role="alert" className="text-xs text-sev-critical">{errors.severity.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function Step2({
  defaults,
  onNext,
  onBack,
}: {
  defaults: { stepsToReproduce?: string };
  onNext: (v: { stepsToReproduce: string }) => void;
  onBack: () => void;
}) {
  type V = z.infer<typeof step2>;
  const { register, handleSubmit, formState: { errors } } = useForm<V>({
    resolver: zodResolver(step2),
    defaultValues: defaults,
  });
  return (
    <form className="space-y-4" onSubmit={handleSubmit(onNext)}>
      <div className="space-y-1">
        <Label htmlFor="stepsToReproduce">Steps to reproduce</Label>
        <Textarea id="stepsToReproduce" rows={6} {...register('stepsToReproduce')} aria-invalid={!!errors.stepsToReproduce} />
        {errors.stepsToReproduce && <p role="alert" className="text-xs text-sev-critical">{errors.stepsToReproduce.message}</p>}
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
}

function Step3({
  files,
  setFiles,
  onBack,
  onSubmit,
  submitting,
}: {
  files: PendingFile[];
  setFiles: (n: PendingFile[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-4">
      <ScreenshotDrop files={files} onChange={setFiles} />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="button" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit bug'}
        </Button>
      </div>
    </div>
  );
}
