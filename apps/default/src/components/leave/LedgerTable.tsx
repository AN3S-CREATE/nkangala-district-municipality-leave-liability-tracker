import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Building2 } from 'lucide-react';
import { divisionLabel, formatZAR, statusLabel, type Employee } from '@/lib/leaveLogic';

export function LedgerTable({
  employees,
  isLoading,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  isLoading: boolean;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}) {
  if (isLoading && employees.length === 0) {
    return (
      <div className="space-y-2 rounded-lg border bg-white p-4 shadow-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-white p-12 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-full bg-[hsl(var(--muted))]">
          <Building2 className="size-6 text-muted-foreground" />
        </div>
        <p className="font-bold text-muted-foreground">No employees in the ledger yet.</p>
        <p className="text-sm text-muted-foreground">Add an employee or import a CSV to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))]/60">
            <TableHead className="font-bold text-[hsl(var(--forest))]">Employee ID</TableHead>
            <TableHead className="font-bold text-[hsl(var(--forest))]">Name</TableHead>
            <TableHead className="font-bold text-[hsl(var(--forest))]">Division</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Daily Rate</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Opening</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Accrual</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Taken</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Forf/Payout</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Closing Bal</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Liability (ZAR)</TableHead>
            <TableHead className="font-bold text-[hsl(var(--forest))]">Status</TableHead>
            <TableHead className="text-right font-bold text-[hsl(var(--forest))]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((e, idx) => (
            <TableRow
              key={e.id}
              className={`transition-colors hover:bg-[hsl(var(--gold))]/5 ${idx % 2 === 0 ? 'bg-white' : 'bg-[hsl(var(--muted))]/30'}`}
            >
              <TableCell className="font-mono text-xs font-medium">{e.employeeId}</TableCell>
              <TableCell className="font-bold">{e.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{divisionLabel(e.divisionId)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatZAR(e.dailyRateZar)}</TableCell>
              <TableCell className="text-right tabular-nums">{e.openingBal}</TableCell>
              <TableCell className="text-right tabular-nums">{e.accrualRate}</TableCell>
              <TableCell className="text-right tabular-nums">{e.lessTaken}</TableCell>
              <TableCell className="text-right tabular-nums">{e.lessForfeit}</TableCell>
              <TableCell className="text-right font-bold tabular-nums">{e.closingBal}</TableCell>
              <TableCell className={`text-right font-extrabold tabular-nums ${e.status === 'crit' ? 'text-destructive' : ''}`}>
                {formatZAR(e.liabilityZar)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={e.status === 'crit' ? 'destructive' : 'secondary'}
                  className={e.status === 'opt' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-semibold' : 'font-semibold'}
                >
                  {statusLabel(e.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="icon" variant="ghost" className="size-8 hover:bg-[hsl(var(--gold))]/15 hover:text-[hsl(var(--forest))]" onClick={() => onEdit(e)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(e)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
