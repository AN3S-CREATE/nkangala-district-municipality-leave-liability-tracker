import { getNodes, createNode, updateNode, deleteNode, type GenesisNode } from '@/lib/genesis-data';
import { LEDGER_PROJECT_ID } from '@/config/projects';
import { recomputeEmployee, type Employee } from '@/lib/leaveLogic';

const FIELD = {
  employeeId: 'Employee ID',
  name: 'Employee Name',
  division: 'Cost Centre / Division',
  dailyRate: 'Daily Rate ZAR',
  openingBal: 'Opening Bal',
  accrualRate: 'Accrual Rate',
  lessTaken: 'Less Taken',
  lessForfeit: 'Less Forf / Payouts',
  closingBal: 'Closing Bal',
  liability: 'Provisioning Liability ZAR',
  status: 'Liability Status',
  ownerId: 'Owner ID',
} as const;

function numFrom(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function nodeToEmployee(node: GenesisNode): Employee {
  const f = node.fieldValues;
  return {
    id: node.id,
    employeeId: f[FIELD.employeeId] ?? '',
    name: f[FIELD.name] ?? '',
    divisionId: f[FIELD.division] ?? '',
    dailyRateZar: numFrom(f[FIELD.dailyRate]),
    openingBal: numFrom(f[FIELD.openingBal]),
    accrualRate: numFrom(f[FIELD.accrualRate]),
    lessTaken: numFrom(f[FIELD.lessTaken]),
    lessForfeit: numFrom(f[FIELD.lessForfeit]),
    closingBal: numFrom(f[FIELD.closingBal]),
    liabilityZar: numFrom(f[FIELD.liability]),
    status: f[FIELD.status] === 'crit' ? 'crit' : 'opt',
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const nodes = await getNodes(LEDGER_PROJECT_ID);
  return nodes.map(nodeToEmployee);
}

export interface EmployeeInput {
  employeeId: string;
  name: string;
  divisionId: string;
  dailyRateZar: number;
  openingBal: number;
  accrualRate: number;
  lessTaken: number;
  lessForfeit: number;
}

function toFieldRecord(input: EmployeeInput, ownerId?: string): Record<string, string> {
  const derived = recomputeEmployee(input);
  const record: Record<string, string> = {
    [FIELD.employeeId]: input.employeeId,
    [FIELD.name]: input.name,
    [FIELD.division]: input.divisionId,
    [FIELD.dailyRate]: String(input.dailyRateZar),
    [FIELD.openingBal]: String(input.openingBal),
    [FIELD.accrualRate]: String(input.accrualRate),
    [FIELD.lessTaken]: String(input.lessTaken),
    [FIELD.lessForfeit]: String(input.lessForfeit),
    [FIELD.closingBal]: String(derived.closingBal),
    [FIELD.liability]: String(derived.liabilityZar),
    [FIELD.status]: derived.status,
  };
  if (ownerId) {
    record[FIELD.ownerId] = ownerId;
  }
  return record;
}

export async function addEmployee(input: EmployeeInput, ownerId?: string): Promise<void> {
  await createNode(LEDGER_PROJECT_ID, {
    ...toFieldRecord(input, ownerId),
    '/text': `${input.employeeId} — ${input.name}`,
  });
}

export async function editEmployee(nodeId: string, input: EmployeeInput, ownerId?: string): Promise<void> {
  await updateNode(LEDGER_PROJECT_ID, nodeId, {
    ...toFieldRecord(input, ownerId),
    '/text': `${input.employeeId} — ${input.name}`,
  });
}

export async function removeEmployee(nodeId: string): Promise<void> {
  await deleteNode(LEDGER_PROJECT_ID, nodeId);
}
