'use client';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Checkbox({ className, ...props }: CheckboxPrimitive.CheckboxProps) {
  return (
    <CheckboxPrimitive.Root className={cn('h-4 w-4 rounded border border-input bg-white flex items-center justify-center data-[state=checked]:bg-accent data-[state=checked]:border-accent', className)} {...props}>
      <CheckboxPrimitive.Indicator>
        <Check className="h-3 w-3 text-white" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
