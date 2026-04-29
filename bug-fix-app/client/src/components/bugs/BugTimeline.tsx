import type { Bug } from '@/types/domain';
import { ScreenshotGallery } from './ScreenshotGallery';
import { CommentThread } from '@/components/comments/CommentThread';

export function BugTimeline({ bug }: { bug: Bug }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-default bg-surface p-5">
        <h2 className="font-display text-base mb-2">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-secondary">{bug.description}</p>
      </section>
      <section className="rounded-xl border border-default bg-surface p-5">
        <h2 className="font-display text-base mb-2">Steps to reproduce</h2>
        <pre className="whitespace-pre-wrap font-mono text-xs text-secondary">{bug.stepsToReproduce}</pre>
      </section>
      {bug.screenshots.length > 0 && (
        <section className="rounded-xl border border-default bg-surface p-5">
          <h2 className="font-display text-base mb-3">Screenshots</h2>
          <ScreenshotGallery urls={bug.screenshots} />
        </section>
      )}
      <CommentThread bugId={bug.id} />
    </div>
  );
}
