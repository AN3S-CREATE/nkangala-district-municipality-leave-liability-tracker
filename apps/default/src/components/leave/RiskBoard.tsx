import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { divisionLabel, formatZAR, STATUS_LABEL, type Employee } from '@/lib/leaveLogic';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

function RiskColumn({
  title,
  icon,
  accentClass,
  borderClass,
  employees,
}: {
  title: string;
  icon: ReactNode;
  accentClass: string;
  borderClass: string;
  employees: Employee[];
}) {
  const sorted = [...employees].sort((a, b) => b.liabilityZar - a.liabilityZar);
  return (
    <div className="flex min-w-[280px] flex-1 flex-col gap-3">
      <div className={`flex items-center gap-2 rounded-lg border-2 px-4 py-3 font-bold ${borderClass} ${accentClass}`}>
        {icon}
        <span>{title}</span>
        <Badge variant="outline" className={`ml-auto font-bold ${borderClass}`}>
          {sorted.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2">
        {sorted.length === 0 && (
          <p className="rounded-lg border-2 border-dashed p-8 text-center text-sm font-medium text-muted-foreground">
            No employees here.
          </p>
        )}
        {sorted.map((e) => (
          <Card key={e.id} className="border-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-1">
              <CardTitle className="flex items-center justify-between text-sm">
                <span className="font-bold">{e.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{e.employeeId}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">{divisionLabel(e.divisionId)}</p>
              <p className={`mt-2 text-lg font-extrabold ${accentClass}`}>{formatZAR(e.liabilityZar)}</p>
              <p className="text-xs text-muted-foreground">{e.closingBal} days closing balance</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function RiskBoard({ employees }: { employees: Employee[] }) {
  const critical = employees.filter((e) => e.status === 'crit');
  const optimal = employees.filter((e) => e.status === 'opt');

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <RiskColumn
        title={STATUS_LABEL.crit}
        icon={<AlertTriangle className="size-4 text-destructive" />}
        accentClass="text-destructive"
        borderClass="border-destructive/30 bg-destructive/5"
        employees={critical}
      />
      <RiskColumn
        title={STATUS_LABEL.opt}
        icon={<ShieldCheck className="size-4 text-emerald-600" />}
        accentClass="text-emerald-600"
        borderClass="border-emerald-500/30 bg-emerald-50"
        employees={optimal}
      />
    </div>
  );
}
