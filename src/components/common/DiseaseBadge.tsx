import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

export function DiseaseBadge({ disease, className }: { disease: string; className?: string }) {
  const isEarly = disease === 'Early Blight';
  return (
    <Badge tone={isEarly ? 'early' : 'late'} className={className}>
      <span className={cn('h-1.5 w-1.5 rounded-full', isEarly ? 'bg-early' : 'bg-late')} aria-hidden />
      {disease}
    </Badge>
  );
}
