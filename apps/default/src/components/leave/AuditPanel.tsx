import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanSearch, Loader2 } from 'lucide-react';
import { formatZAR, type LiabilitySummary } from '@/lib/leaveLogic';

export function AuditPanel({
  summary,
  isAuditing,
  lastAuditAt,
  onRunAudit,
}: {
  summary: LiabilitySummary;
  isAuditing: boolean;
  lastAuditAt: string | null;
  onRunAudit: () => void;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-[hsl(var(--muted))]/50 pb-4">
        <div>
          <CardTitle className="text-lg font-extrabold text-[hsl(var(--forest))]">
            Top 5 High-Liability Employees
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            The low-hanging fruit — enforce mandatory PTO here first.
          </p>
        </div>
        <Button
          onClick={onRunAudit}
          disabled={isAuditing}
          className="shrink-0 bg-[hsl(var(--gold))] font-bold text-black shadow-md hover:bg-[hsl(var(--gold-hover))]"
        >
          {isAuditing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanSearch className="size-4" />
          )}
          {isAuditing ? 'Auditing…' : 'Run ZAR Audit'}
        </Button>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="space-y-2">
          {summary.topFive.map((e, idx) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <Badge className={`font-mono font-bold ${idx === 0 ? 'bg-[hsl(var(--gold))] text-black' : 'bg-muted text-muted-foreground'}`}>
                  #{idx + 1}
                </Badge>
                <div>
                  <p className="text-sm font-bold">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.employeeId}</p>
                </div>
              </div>
              <span className="font-extrabold text-destructive">{formatZAR(e.liabilityZar)}</span>
            </div>
          ))}
          {summary.topFive.length === 0 && (
            <p className="rounded-lg border-2 border-dashed p-6 text-center text-sm font-medium text-muted-foreground">
              No employees to rank yet.
            </p>
          )}
        </div>

        <div className="mt-6 rounded-lg border bg-white p-4">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[hsl(var(--forest))]">
            Liability by Cost Centre / Division
          </p>
          {summary.byDivision.length === 0 ? (
            <p className="rounded-lg border-2 border-dashed p-6 text-center text-sm font-medium text-muted-foreground">
              No division data yet — add employees to see the breakdown.
            </p>
          ) : (
            <div className="space-y-3">
              {summary.byDivision.map((d) => {
                const pct =
                  summary.totalLiability > 0 ? (d.totalLiability / summary.totalLiability) * 100 : 0;
                return (
                  <div key={d.divisionId} className="text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{d.label}</span>
                      <span className="font-bold">{formatZAR(d.totalLiability)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--forest))] transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {lastAuditAt && (
          <p className="mt-4 text-xs text-muted-foreground">
            Last audit dispatched at {new Date(lastAuditAt).toLocaleString('en-ZA')}. Full executive
            summary logged to the Liability Audit Log project.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
