import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function CommentEditor({
  initial = '',
  submitting,
  onSubmit,
  onCancel,
  cta = 'Post comment',
}: {
  initial?: string;
  submitting: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel?: () => void;
  cta?: string;
}) {
  const [text, setText] = useState(initial);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
      }}
    >
      <Textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Comment text"
        placeholder="Add a comment..."
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
          {submitting ? 'Posting…' : cta}
        </Button>
      </div>
    </form>
  );
}
