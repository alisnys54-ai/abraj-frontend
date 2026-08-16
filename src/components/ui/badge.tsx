import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';
import { useLocale } from '@/lib/i18n/locale-context';

const TONE: Record<string, string> = {
  slate: 'bg-secondary/10 text-secondary',
  teal: 'bg-accent/15 text-accent',
  gold: 'bg-gold/25 text-[#8a6d00]',
  red: 'bg-destructive/15 text-destructive',
  gray: 'bg-muted text-muted-foreground',
};

export function Badge({ className, tone = 'gray', ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof TONE }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONE[tone], className)} {...props} />;
}

const STATUS_TONE: Record<string, keyof typeof TONE> = {
  draft: 'gray', pending: 'slate', in_progress: 'gold', on_hold: 'gray',
  waiting_approval: 'gold', completed: 'teal', rejected: 'red', cancelled: 'gray', archived: 'gray',
};
export function StatusBadge({ name }: { name: string }) {
  const { t } = useLocale();
  const label = t(`common.statusNames.${name}`);
  return <Badge tone={STATUS_TONE[name] ?? 'gray'}>{label && !label.includes('.') ? label : name.replace(/_/g, ' ')}</Badge>;
}

const PRIORITY_TONE: Record<string, keyof typeof TONE> = { low: 'slate', medium: 'gold', high: 'gold', critical: 'red' };
export function PriorityBadge({ name }: { name: string }) {
  const { t } = useLocale();
  const label = t(`common.priorityNames.${name}`);
  return <Badge tone={PRIORITY_TONE[name] ?? 'gray'}>{label && !label.includes('.') ? label : name}</Badge>;
}
