import { useEffect, useState, type FormEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DIVISIONS } from '@/config/projects';
import type { EmployeeInput } from '@/lib/employeeData';
import type { Employee } from '@/lib/leaveLogic';
import { recomputeEmployee, formatZAR, statusLabel } from '@/lib/leaveLogic';

const emptyForm: EmployeeInput = {
  employeeId: '',
  name: '',
  divisionId: DIVISIONS[0]!.id,
  dailyRateZar: 0,
  openingBal: 0,
  accrualRate: 24,
  lessTaken: 0,
  lessForfeit: 0,
};

export function EmployeeFormDialog({
  open,
  onOpenChange,
  editing,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Employee | null;
  onSubmit: (input: EmployeeInput) => Promise<void>;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<EmployeeInput>(emptyForm);

  useEffect(() => {
    if (editing) {
      setForm({
        employeeId: editing.employeeId,
        name: editing.name,
        divisionId: editing.divisionId,
        dailyRateZar: editing.dailyRateZar,
        openingBal: editing.openingBal,
        accrualRate: editing.accrualRate,
        lessTaken: editing.lessTaken,
        lessForfeit: editing.lessForfeit,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const preview = recomputeEmployee(form);
  const isValid = form.employeeId.trim() !== '' && form.name.trim() !== '';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
            <DialogDescription>
              All liability figures are calculated automatically in ZAR.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input
                id="employeeId"
                value={form.employeeId}
                onChange={(e) => setForm((f) => ({ ...f, employeeId: e.target.value }))}
                placeholder="EMP-016"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Employee Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                required
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="division">Cost Centre / Division</Label>
              <Select value={form.divisionId} onValueChange={(v) => setForm((f) => ({ ...f, divisionId: v }))}>
                <SelectTrigger id="division" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dailyRate">Daily Rate (ZAR)</Label>
              <Input
                id="dailyRate"
                type="number"
                min={0}
                step="0.01"
                value={form.dailyRateZar}
                onChange={(e) => setForm((f) => ({ ...f, dailyRateZar: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="openingBal">Opening Bal (days)</Label>
              <Input
                id="openingBal"
                type="number"
                step="0.5"
                value={form.openingBal}
                onChange={(e) => setForm((f) => ({ ...f, openingBal: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accrualRate">Accrual Rate (days/yr)</Label>
              <Input
                id="accrualRate"
                type="number"
                step="0.5"
                value={form.accrualRate}
                onChange={(e) => setForm((f) => ({ ...f, accrualRate: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lessTaken">Less Taken (days)</Label>
              <Input
                id="lessTaken"
                type="number"
                step="0.5"
                value={form.lessTaken}
                onChange={(e) => setForm((f) => ({ ...f, lessTaken: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lessForfeit">Less Forf / Payouts (days)</Label>
              <Input
                id="lessForfeit"
                type="number"
                step="0.5"
                value={form.lessForfeit}
                onChange={(e) => setForm((f) => ({ ...f, lessForfeit: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Closing Bal</span>
              <span className="font-medium">{preview.closingBal.toFixed(1)} days</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Provisioning Liability</span>
              <span className="font-semibold">{formatZAR(preview.liabilityZar)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">{statusLabel(preview.status)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting} className="bg-[hsl(var(--forest))] font-bold text-white hover:bg-[hsl(var(--forest-dark))]">
              {isSubmitting ? 'Saving…' : editing ? 'Save Changes' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
