import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatZAR, type LiabilitySummary } from '@/lib/leaveLogic';
import { AlertTriangle, Users, Wallet, ShieldCheck } from 'lucide-react';

export function KpiCards({ summary, isLoading }: { summary: LiabilitySummary; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  const items = [
    {
      label: 'Total Leave Liability',
      value: formatZAR(summary.totalLiability),
      icon: Wallet,
      bg: 'bg-[hsl(var(--forest))]',
      text: 'text-[hsl(var(--forest))]',
    },
    {
      label: 'Employees Tracked',
      value: String(summary.employeesCount),
      icon: Users,
      bg: 'bg-[hsl(var(--forest-light))]',
      text: 'text-[hsl(var(--forest-light))]',
    },
    {
      label: 'Critical Debt',
      value: String(summary.criticalCount),
      icon: AlertTriangle,
      bg: 'bg-destructive',
      text: 'text-destructive',
    },
    {
      label: 'Optimal Status',
      value: String(summary.optimalCount),
      icon: ShieldCheck,
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, idx) => {
        const Icon = item.icon;
        const useGold = idx === 0 || idx === 1;
        return (
          <Card
            key={item.label}
            className={`group border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              useGold ? 'border-t-[3px] border-t-[hsl(var(--gold))]' : ''
            }`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {item.label}
                <div className={`flex size-7 items-center justify-center rounded-full ${item.bg}/10`}>
                  <Icon className={`size-3.5 ${item.text}`} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-extrabold tracking-tight sm:text-2xl ${item.text}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
