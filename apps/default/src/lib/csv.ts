import Papa from 'papaparse';
import { DIVISIONS } from '@/config/projects';
import { STATUS_LABEL_PLAIN, type Employee } from '@/lib/leaveLogic';
import type { EmployeeInput } from '@/lib/employeeData';

const HEADERS = [
  'Employee ID',
  'Employee Name',
  'Cost Centre / Division',
  'Daily Rate ZAR',
  'Opening Bal',
  'Accrual Rate',
  'Less Taken',
  'Less Forf / Payouts',
  'Closing Bal',
  'Provisioning Liability ZAR',
  'Liability Status',
] as const;

function divisionIdFromLabelOrId(value: string): string {
  const trimmed = value.trim();
  const byId = DIVISIONS.find((d) => d.id.toLowerCase() === trimmed.toLowerCase());
  if (byId) return byId.id;
  const byLabel = DIVISIONS.find((d) => d.label.toLowerCase() === trimmed.toLowerCase());
  return byLabel ? byLabel.id : trimmed;
}

export interface CsvParseResult {
  rows: EmployeeInput[];
  errors: string[];
}

/** Parses a raw CSV string into EmployeeInput rows the ledger accepts. */
export function parseEmployeeCsv(csvText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: string[] = parsed.errors.map((e) => `Row ${e.row ?? '?'}: ${e.message}`);
  const rows: EmployeeInput[] = [];

  parsed.data.forEach((raw, idx) => {
    const employeeId = (raw['Employee ID'] ?? '').trim();
    const name = (raw['Employee Name'] ?? '').trim();
    if (employeeId === '' || name === '') {
      errors.push(`Row ${idx + 2}: missing Employee ID or Employee Name — skipped`);
      return;
    }
    const divisionRaw = raw['Cost Centre / Division'] ?? '';
    rows.push({
      employeeId,
      name,
      divisionId: divisionIdFromLabelOrId(divisionRaw),
      dailyRateZar: Number(raw['Daily Rate ZAR']) || 0,
      openingBal: Number(raw['Opening Bal']) || 0,
      accrualRate: Number(raw['Accrual Rate']) || 24,
      lessTaken: Number(raw['Less Taken']) || 0,
      lessForfeit: Number(raw['Less Forf / Payouts']) || 0,
    });
  });

  return { rows, errors };
}

/** Serializes ledger rows (with computed fields) into a CSV string for one-click export. */
export function exportEmployeesToCsv(employees: Employee[]): string {
  const data = employees.map((e) => ({
    'Employee ID': e.employeeId,
    'Employee Name': e.name,
    'Cost Centre / Division': e.divisionId,
    'Daily Rate ZAR': e.dailyRateZar,
    'Opening Bal': e.openingBal,
    'Accrual Rate': e.accrualRate,
    'Less Taken': e.lessTaken,
    'Less Forf / Payouts': e.lessForfeit,
    'Closing Bal': e.closingBal,
    'Provisioning Liability ZAR': e.liabilityZar,
    'Liability Status': STATUS_LABEL_PLAIN[e.status],
  }));
  return Papa.unparse({ fields: HEADERS as unknown as string[], data });
}

export function downloadCsv(filename: string, csvText: string): void {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
