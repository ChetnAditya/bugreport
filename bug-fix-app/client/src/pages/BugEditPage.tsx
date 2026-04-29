import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useBug, useUpdateBug } from '@/hooks/bugs/use-bugs';
import { useMe } from '@/hooks/use-auth';

const schema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  stepsToReproduce: z.string().min(5).max(2000),
});
type V = z.infer<typeof schema>;

export function BugEditPage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const bug = useBug(id);
  const update = useUpdateBug(id ?? '');
  const nav = useNavigate();

  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<V>({
    resolver: zodResolver(schema),
    values: bug.data && {
      title: bug.data.title,
      description: bug.data.description,
      stepsToReproduce: bug.data.stepsToReproduce,
    },
  });

  if (bug.isLoading || !me.data) return <Skeleton className="h-40 w-full" />;
  if (!bug.data) return <p>Not found.</p>;

  const isReporter = bug.data.reporterId === me.data.id;
  const isAdmin = me.data.role === 'ADMIN';
  const canEdit = (isReporter || isAdmin) && bug.data.status === 'NEW';
  if (!canEdit) {
    return (
      <p className="text-secondary">
        This bug can no longer be edited.{' '}
        <Link to={`/bugs/${bug.data.id}`} className="text-accent underline">Back</Link>
      </p>
    );
  }

  const onSubmit = handleSubmit(async (vals) => {
    try {
      await update.mutateAsync(vals);
      toast.success('Bug updated');
      nav(`/bugs/${bug.data!.id}`);
    } catch {
      toast.error('Could not update');
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      <h1 className="font-display text-xl">Edit bug</h1>
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
        <Label htmlFor="stepsToReproduce">Steps to reproduce</Label>
        <Textarea id="stepsToReproduce" rows={6} {...register('stepsToReproduce')} aria-invalid={!!errors.stepsToReproduce} />
        {errors.stepsToReproduce && <p role="alert" className="text-xs text-sev-critical">{errors.stepsToReproduce.message}</p>}
      </div>
      <div className="flex gap-2 justify-end">
        <Link to={`/bugs/${bug.data.id}`}>
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}
