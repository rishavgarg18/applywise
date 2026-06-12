import { Card } from "@/components/ui/card";

export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-lg bg-surface2" />
        <div className="h-4 w-80 rounded-lg bg-surface2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-24 bg-surface2/50" />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="h-28 bg-surface2/50" />
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-6 w-48 rounded-lg bg-surface2" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="h-20 bg-surface2/50" />
        ))}
      </div>
    </div>
  );
}
