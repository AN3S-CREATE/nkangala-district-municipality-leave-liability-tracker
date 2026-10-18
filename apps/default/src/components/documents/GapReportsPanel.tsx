import * as React from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/config/agents';

interface GapNode {
  id: string;
  fieldValues: Record<string, string | number>;
  parentId: string | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  '🔴 Critical': 'bg-red-500/10 text-red-500 border-red-500/20',
  '🟠 High': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  '🟡 Medium': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  '🟢 Low': 'bg-green-500/10 text-green-500 border-green-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  'Open': 'bg-red-500/10 text-red-500',
  'In Progress': 'bg-blue-500/10 text-blue-500',
  'Resolved': 'bg-emerald-500/10 text-emerald-500',
};

export function GapReportsPanel() {
  const [gaps, setGaps] = React.useState<GapNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/taskade/projects/${PROJECTS.gapReports}/nodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setGaps(data?.payload?.nodes ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load gap reports');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = gaps.filter((g) => {
    const title = String(g.fieldValues?.['text'] ?? g.fieldValues?.['/text'] ?? '').toLowerCase();
    const doc = String(g.fieldValues?.['Document'] ?? g.fieldValues?.['/attributes/@doc'] ?? '').toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || doc.includes(q);
  });

  const getField = (g: GapNode, key: string) => String(g.fieldValues?.[key] ?? '-');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <AlertTriangle className="size-8 text-destructive" />
        <p className="text-sm font-medium">Could not load gap reports</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search gaps..."
          className="pl-9 border-2 focus-visible:border-[hsl(var(--forest))] focus-visible:ring-[hsl(var(--forest))]/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
            <AlertTriangle className="size-6 text-[hsl(var(--forest))]" />
          </div>
          <p className="text-sm font-bold text-[hsl(var(--forest))]">No gap reports yet</p>
          <p className="text-xs text-muted-foreground">Gaps will appear here as the Expert AI reviews documents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((gap) => {
            const title = getField(gap, '/text') || getField(gap, 'text');
            const severity = getField(gap, '/attributes/@sev') || getField(gap, 'Severity');
            const type = getField(gap, '/attributes/@type') || getField(gap, 'Gap Type');
            const doc = getField(gap, '/attributes/@doc') || getField(gap, 'Document');
            const section = getField(gap, '/attributes/@sectn') || getField(gap, 'Section');
            const status = getField(gap, '/attributes/@status') || getField(gap, 'Resolution');
            const description = getField(gap, '/attributes/@gap') || getField(gap, 'Gap Description');
            const fix = getField(gap, '/attributes/@sugg') || getField(gap, 'Suggested Fix');

            return (
              <div key={gap.id} className="rounded-lg border border-l-[3px] border-l-[hsl(var(--forest))] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn('mt-0.5 size-4 shrink-0', severity.includes('Critical') ? 'text-red-500' : severity.includes('High') ? 'text-orange-500' : 'text-amber-500')} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={cn('text-xs', SEVERITY_COLORS[severity] ?? '')}>
                          {severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {type}
                        </Badge>
                        <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[status] ?? '')}>
                          {status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{doc}</p>
                    {section !== '-' && <p>§ {section}</p>}
                  </div>
                </div>
                {description !== '-' && (
                  <p className="mt-3 text-sm text-muted-foreground">{description}</p>
                )}
                {fix !== '-' && (
                  <div className="mt-2 rounded bg-muted/50 p-2.5">
                    <p className="text-xs font-medium text-muted-foreground">Suggested Fix</p>
                    <p className="mt-0.5 text-sm">{fix}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
