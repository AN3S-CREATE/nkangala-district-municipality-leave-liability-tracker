import { CRITICAL_THRESHOLD_ZAR, DIVISIONS } from '@/config/projects';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  divisionId: string;
  dailyRateZar: number;
  openingBal: number;
  accrualRate: number;
  lessTaken: number;
  lessForfeit: number;
  closingBal: number;
  liabilityZar: number;
  status: 'crit' | 'opt';
}

export function divisionLabel(divisionId: string): string {
  return DIVISIONS.find((d) => d.id === divisionId)?.label ?? divisionId;
}

export function computeClosingBal(input: {
  openingBal: number;
  accrualRate: number;
  lessTaken: number;
  lessForfeit: number;
}): number {
  return input.openingBal + input.accrualRate - input.lessTaken - input.lessForfeit;
}

export function computeLiability(closingBal: number, dailyRateZar: number): number {
  return closingBal * dailyRateZar;
}

export function computeStatus(liabilityZar: number): 'crit' | 'opt' {
  return liabilityZar > CRITICAL_THRESHOLD_ZAR ? 'crit' : 'opt';
}

/** Single source of truth for status display labels — avoids drift across UI + CSV export. */
export const STATUS_LABEL: Record<Employee['status'], string> = {
  crit: '🚨 Critical Debt',
  opt: '✅ Optimal',
};

/** Plain-text (no emoji) variant for contexts like CSV export where emoji are undesirable. */
export const STATUS_LABEL_PLAIN: Record<Employee['status'], string> = {
  crit: 'Critical Debt',
  opt: 'Optimal',
};

export function statusLabel(status: Employee['status']): string {
  return STATUS_LABEL[status];
}

/** Recompute closing bal, liability, and status derived fields for an employee row. */
export function recomputeEmployee(
  e: Pick<Employee, 'openingBal' | 'accrualRate' | 'lessTaken' | 'lessForfeit' | 'dailyRateZar'>,
): Pick<Employee, 'closingBal' | 'liabilityZar' | 'status'> {
  const closingBal = computeClosingBal(e);
  const liabilityZar = computeLiability(closingBal, e.dailyRateZar);
  return { closingBal, liabilityZar, status: computeStatus(liabilityZar) };
}

export function formatZAR(value: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export interface LiabilitySummary {
  totalLiability: number;
  employeesCount: number;
  criticalCount: number;
  optimalCount: number;
  topFive: Employee[];
  byDivision: Array<{ divisionId: string; label: string; totalLiability: number; count: number }>;
}

export function summarize(employees: Employee[]): LiabilitySummary {
  const totalLiability = employees.reduce((sum, e) => sum + e.liabilityZar, 0);
  const criticalCount = employees.filter((e) => e.status === 'crit').length;
  const optimalCount = employees.length - criticalCount;
  const topFive = [...employees].sort((a, b) => b.liabilityZar - a.liabilityZar).slice(0, 5);

  const byDivisionMap = new Map<string, { totalLiability: number; count: number }>();
  for (const e of employees) {
    const entry = byDivisionMap.get(e.divisionId) ?? { totalLiability: 0, count: 0 };
    entry.totalLiability += e.liabilityZar;
    entry.count += 1;
    byDivisionMap.set(e.divisionId, entry);
  }
  const byDivision = Array.from(byDivisionMap.entries())
    .map(([divisionId, v]) => ({ divisionId, label: divisionLabel(divisionId), ...v }))
    .sort((a, b) => b.totalLiability - a.totalLiability);

  return { totalLiability, employeesCount: employees.length, criticalCount, optimalCount, topFive, byDivision };
}
