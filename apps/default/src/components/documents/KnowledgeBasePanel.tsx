import * as React from 'react';
import { Brain, Search, TrendingUp, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/config/agents';

interface KbNode {
  id: string;
  fieldValues: Record<string, string | number>;
  parentId: string | null;
}

export function KnowledgeBasePanel() {
  const [entries, setEntries] = React.useState<KbNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/taskade/projects/${PROJECTS.knowledgeBase}/nodes`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setEntries(data?.payload?.nodes ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load knowledge base');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = entries.filter((e) => {
    const title = String(e.fieldValues?.['text'] ?? e.fieldValues?.['/text'] ?? '').toLowerCase();
    const pattern = String(e.fieldValues?.['Pattern / Lesson'] ?? e.fieldValues?.['/attributes/@patrn'] ?? '').toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || pattern.includes(q);
  });

  const getField = (e: KbNode, key: string) => String(e.fieldValues?.[key] ?? '-');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <Brain className="size-8 text-destructive" />
        <p className="text-sm font-medium">Could not load knowledge base</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search knowledge base..."
          className="pl-9 border-2 focus-visible:border-[hsl(var(--forest))] focus-visible:ring-[hsl(var(--forest))]/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
            <Brain className="size-6 text-[hsl(var(--forest))]" />
          </div>
          <p className="text-sm font-bold text-[hsl(var(--forest))]">Knowledge base is empty</p>
          <p className="text-xs text-muted-foreground">
            Patterns and lessons learned from finalized documents will compound here
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const title = getField(entry, '/text') || getField(entry, 'text');
            const domain = getField(entry, '/attributes/@domn') || getField(entry, 'Domain');
            const pattern = getField(entry, '/attributes/@patrn') || getField(entry, 'Pattern / Lesson');
            const status = getField(entry, '/attributes/@status') || getField(entry, 'Status');
            const discovered = getField(entry, '/attributes/@discv') || getField(entry, 'Discovered');
            const sourceDoc = getField(entry, '/attributes/@srcDoc') || getField(entry, 'Source Document');
            const frequency = Number(entry.fieldValues?.['/attributes/@freq'] ?? entry.fieldValues?.['Frequency'] ?? 0);

            return (
              <div key={entry.id} className="rounded-lg border border-l-[3px] border-l-[hsl(var(--forest))] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {domain !== '-' && (
                        <Badge variant="outline" className="text-xs">
                          {domain}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-zinc-500/10 text-zinc-500',
                        )}
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>
                  {frequency > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="size-3" />
                      <span>{frequency}x</span>
                    </div>
                  )}
                </div>
                {pattern !== '-' && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{pattern}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {sourceDoc !== '-' && <span>From: {sourceDoc}</span>}
                  {discovered !== '-' && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(discovered).toLocaleDateString('en-ZA')}
                    </span>
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
