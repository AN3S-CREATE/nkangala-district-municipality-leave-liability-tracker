import * as React from 'react';
import { BookOpen, Search, ExternalLink, Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/config/agents';

interface EvidenceNode {
  id: string;
  fieldValues: Record<string, string | number>;
  parentId: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  Citation: 'bg-blue-500/10 text-blue-500',
  'Data Point': 'bg-emerald-500/10 text-emerald-500',
  'Reference Doc': 'bg-violet-500/10 text-violet-500',
  Regulation: 'bg-amber-500/10 text-amber-500',
  'Case Law': 'bg-red-500/10 text-red-500',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  High: 'bg-emerald-500/10 text-emerald-500',
  Medium: 'bg-amber-500/10 text-amber-500',
  Low: 'bg-red-500/10 text-red-500',
};

export function EvidencePanel() {
  const [items, setItems] = React.useState<EvidenceNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/taskade/projects/${PROJECTS.evidence}/nodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setItems(data?.payload?.nodes ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load evidence');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = items.filter((item) => {
    const title = String(item.fieldValues?.['text'] ?? item.fieldValues?.['/text'] ?? '').toLowerCase();
    const src = String(item.fieldValues?.['Source'] ?? item.fieldValues?.['/attributes/@src'] ?? '').toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || src.includes(q);
  });

  const getField = (item: EvidenceNode, key: string) => String(item.fieldValues?.[key] ?? '-');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <BookOpen className="size-8 text-destructive" />
        <p className="text-sm font-medium">Could not load evidence</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search evidence..."
          className="pl-9 border-2 focus-visible:border-[hsl(var(--forest))] focus-visible:ring-[hsl(var(--forest))]/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
            <BookOpen className="size-6 text-[hsl(var(--forest))]" />
          </div>
          <p className="text-sm font-bold text-[hsl(var(--forest))]">No evidence records yet</p>
          <p className="text-xs text-muted-foreground">Evidence will accumulate as documents are reviewed</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((item) => {
            const title = getField(item, '/text') || getField(item, 'text');
            const type = getField(item, '/attributes/@evtyp') || getField(item, 'Evidence Type');
            const confidence = getField(item, '/attributes/@confd') || getField(item, 'Confidence');
            const source = getField(item, '/attributes/@src') || getField(item, 'Source');
            const linkedDoc = getField(item, '/attributes/@linkd') || getField(item, 'Linked Document');
            const dateAdded = getField(item, '/attributes/@added') || getField(item, 'Date Added');

            return (
              <div key={item.id} className="rounded-lg border border-l-[3px] border-l-[hsl(var(--gold))] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className={cn('text-xs', TYPE_COLORS[type] ?? '')}>
                        {type}
                      </Badge>
                      <Badge variant="outline" className={cn('text-xs', CONFIDENCE_COLORS[confidence] ?? '')}>
                        {confidence} confidence
                      </Badge>
                    </div>
                  </div>
                </div>
                {source !== '-' && (
                  <p className="mt-2 text-xs text-muted-foreground">{source}</p>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  {linkedDoc !== '-' && (
                    <span className="flex items-center gap-1">
                      <Link className="size-3" />
                      {linkedDoc}
                    </span>
                  )}
                  {dateAdded !== '-' && (
                    <span>{new Date(dateAdded).toLocaleDateString('en-ZA')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
