import { cn } from '@/lib/utils';
import { initials } from '@/lib/utils';

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full bg-secondary text-white font-medium flex-none', className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
