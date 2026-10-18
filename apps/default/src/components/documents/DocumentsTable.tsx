import * as React from 'react';
import { FileText, Plus, Search, Filter, ExternalLink, Clock, Shield, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PROJECTS } from '@/config/agents';

interface DocumentNode {
  id: string;
  fieldValues: Record<string, string | number>;
  parentId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  '📝 Draft': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  '🔍 In Review': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  '✅ Reviewed': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  '🔒 Final': 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  '📦 Archived': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-500/10 text-red-500',
  'High': 'bg-orange-500/10 text-orange-500',
  'Medium': 'bg-amber-500/10 text-amber-500',
  'Low': 'bg-green-500/10 text-green-500',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Report': <FileText className="size-4" />,
  'Policy': <Shield className="size-4" />,
  'Contract': <FileText className="size-4" />,
  'Proposal': <Target className="size-4" />,
  'Manual': <FileText className="size-4" />,
  'Memo': <FileText className="size-4" />,
};

export function DocumentsTable() {
  const [docs, setDocs] = React.useState<DocumentNode[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/taskade/projects/${PROJECTS.documents}/nodes`);
        if (!res.ok && res.status !== 404) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setDocs(data?.payload?.nodes ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = docs.filter((d) => {
    const title = String(d.fieldValues?.['text'] ?? d.fieldValues?.['/text'] ?? '').toLowerCase();
    const domain = String(d.fieldValues?.['Domain'] ?? d.fieldValues?.['/attributes/@domn1'] ?? '').toLowerCase();
    const owner = String(d.fieldValues?.['Owner'] ?? d.fieldValues?.['/attributes/@owner'] ?? '').toLowerCase();
    const q = search.toLowerCase();
    return title.includes(q) || domain.includes(q) || owner.includes(q);
  });

  const getField = (d: DocumentNode, key: string) => String(d.fieldValues?.[key] ?? '-');
  const getFieldShort = (d: DocumentNode, key: string) => String(d.fieldValues?.[key] ?? '');

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <FileText className="size-6 text-destructive" />
        </div>
        <p className="text-sm font-medium">Could not load documents</p>
        <p className="text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" className="border-[hsl(var(--forest))]/30 text-[hsl(var(--forest))] hover:bg-[hsl(var(--forest))]/5">
          <Filter className="mr-2 size-3" />
          Filter
        </Button>
        <Button size="sm" className="bg-[hsl(var(--forest))] font-bold text-white hover:bg-[hsl(var(--forest-dark))]">
          <Plus className="mr-2 size-3" />
          New Document
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No documents found</p>
          <p className="text-xs text-muted-foreground">
            {search ? 'Try adjusting your search terms' : 'Add your first document to get started'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-[hsl(var(--muted))]/60">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Domain</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Health</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Last Reviewed</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--forest))]">Owner</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const title = getField(doc, '/text') || getField(doc, 'text');
                  const status = getFieldShort(doc, '/attributes/@st4us') || getFieldShort(doc, 'Status');
                  const domain = getFieldShort(doc, '/attributes/@domn1') || getFieldShort(doc, 'Domain');
                  const priority = getFieldShort(doc, '/attributes/@prio9') || getFieldShort(doc, 'Priority');
                  const version = getField(doc, '/attributes/@versn') || getField(doc, 'Version');
                  const score = Number(doc.fieldValues?.['/attributes/@compl'] ?? doc.fieldValues?.['Completeness Score'] ?? 0);
                  const lastReview = getField(doc, '/attributes/@lstrv') || getField(doc, 'Last Reviewed');
                  const owner = getField(doc, '/attributes/@owner') || getField(doc, 'Owner');
                  const docType = getFieldShort(doc, '/attributes/@docty') || getFieldShort(doc, 'Document Type');

                  const scoreColor =
                    score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';

                  return (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                            {TYPE_ICONS[docType] ?? <FileText className="size-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium max-w-[220px]">{title || 'Untitled'}</p>
                            <p className="text-xs text-muted-foreground">{docType || 'Document'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_COLORS[status] ?? '')}>
                          {status || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">{domain || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-medium', PRIORITY_COLORS[priority] ?? 'text-muted-foreground')}>
                          {priority || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums">{version}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-semibold tabular-nums', scoreColor)}>
                          {score}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="size-3" />
                          {lastReview !== '-' ? new Date(lastReview).toLocaleDateString('en-ZA') : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{owner}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon" className="size-8" aria-label="Open document">
                          <ExternalLink className="size-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} document{filtered.length !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </p>
    </div>
  );
}
