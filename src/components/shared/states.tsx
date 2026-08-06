import { cn } from '@/lib/utils';

export function EmptyState({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-input bg-white p-12 text-center">
      <div className="mx-auto mb-4 h-11 w-11 rounded-xl bg-muted" />
      <div className="text-sm font-medium mb-1">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mb-4">{subtitle}</div>}
      {action}
    </div>
  );
}

export function ErrorState({ title, subtitle, onRetry }: { title: string; subtitle?: string; onRetry?: () => void }) {
  return (
    <div className={cn('rounded-lg border p-11 text-center', 'border-destructive/30 bg-destructive/5')}>
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">!</div>
      <div className="text-sm font-medium text-destructive mb-1">{title}</div>
      {subtitle && <div className="text-xs text-muted-foreground mb-4">{subtitle}</div>}
      {onRetry && (
        <button onClick={onRetry} className="rounded-md border border-input bg-white px-4 py-2 text-xs font-medium">
          Retry
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="text-xs font-medium disabled:text-muted-foreground/50 rounded-md border border-input px-3 py-1.5">
        ← Prev
      </button>
      <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="text-xs font-medium disabled:text-muted-foreground/50 rounded-md border border-input px-3 py-1.5">
        Next →
      </button>
    </div>
  );
}
