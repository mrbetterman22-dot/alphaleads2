import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <h1 className="text-2xl font-bold text-sidebar-foreground">
        Penolet Finance
      </h1>
    </div>
  );
}
