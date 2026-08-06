'use client';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;
export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn('inline-flex gap-1 rounded-md bg-muted p-1', className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn('rounded-sm px-3 py-1.5 text-xs font-medium data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground', className)}
      {...props}
    />
  );
}
export const TabsContent = TabsPrimitive.Content;
