import { create } from 'zustand';
import { fetchEmployees, addEmployee, editEmployee, removeEmployee, type EmployeeInput } from '@/lib/employeeData';
import { summarize, type Employee, type LiabilitySummary } from '@/lib/leaveLogic';
import { runFlow } from '@/lib/genesis-flows';
import { AUDIT_FLOW_ID } from '@/config/projects';

interface LedgerState {
  employees: Employee[];
  summary: LiabilitySummary;
  isLoading: boolean;
  error: string | null;
  isAuditing: boolean;
  lastAuditAt: string | null;
  isImporting: boolean;

  fetchAll: () => Promise<void>;
  createEmployee: (input: EmployeeInput, ownerId?: string) => Promise<void>;
  updateEmployee: (nodeId: string, input: EmployeeInput, ownerId?: string) => Promise<void>;
  deleteEmployee: (nodeId: string) => Promise<void>;
  /** `rejected: true` means a previous import was still in flight and this call was a no-op. */
  bulkImport: (inputs: EmployeeInput[], ownerId?: string) => Promise<{ succeeded: number; failed: number; rejected?: boolean }>;
  /** Returns false when rejected because an audit was already in flight, true otherwise. */
  runAudit: () => Promise<boolean>;
}

/**
 * Monotonically increasing token used to discard stale fetchAll() responses.
 *
 * Every call starts its own fresh request (never joins an in-flight one) so a
 * fetch issued right after a mutation (create/update/delete) always reflects
 * that mutation — joining an older in-flight request could silently drop the
 * just-written change. The token instead guarantees "last call wins": if two
 * fetchAll() calls overlap, only the response of the most recently started
 * one is applied to state, so a slow earlier response can never clobber a
 * faster, more recent one.
 */
let fetchAllRequestToken = 0;

export const useLedgerStore = create<LedgerState>((set, get) => ({
  employees: [],
  summary: summarize([]),
  isLoading: false,
  error: null,
  isAuditing: false,
  lastAuditAt: null,
  isImporting: false,

  fetchAll: async () => {
    const token = ++fetchAllRequestToken;
    set({ isLoading: true, error: null });
    try {
      const employees = await fetchEmployees();
      // A newer fetchAll() started after this one — let it win instead.
      if (token !== fetchAllRequestToken) return;
      set({ employees, summary: summarize(employees), isLoading: false });
    } catch (err) {
      if (token !== fetchAllRequestToken) return;
      set({ error: err instanceof Error ? err.message : 'Failed to load ledger', isLoading: false });
    }
  },

  createEmployee: async (input, ownerId) => {
    await addEmployee(input, ownerId);
    await get().fetchAll();
  },

  updateEmployee: async (nodeId, input, ownerId) => {
    await editEmployee(nodeId, input, ownerId);
    await get().fetchAll();
  },

  deleteEmployee: async (nodeId) => {
    await removeEmployee(nodeId);
    await get().fetchAll();
  },

  bulkImport: async (inputs, ownerId) => {
    // Same synchronous data-layer guard as runAudit(): the dialog's "Import"
    // button disables on isImporting, but that only takes effect after React
    // commits a re-render. A rapid double-click (or a second call site) could
    // otherwise kick off two overlapping imports writing the same rows twice.
    // Reading get().isImporting here is synchronous with no await before the
    // set(), so a second overlapping call is rejected immediately.
    if (get().isImporting) return { succeeded: 0, failed: 0, rejected: true };

    set({ isImporting: true });
    let succeeded = 0;
    let failed = 0;
    try {
      for (const input of inputs) {
        try {
          await addEmployee(input, ownerId);
          succeeded += 1;
        } catch {
          failed += 1;
        }
      }
      await get().fetchAll();
      return { succeeded, failed };
    } finally {
      set({ isImporting: false });
    }
  },

  runAudit: async () => {
    // Synchronous guard at the data layer, not just the UI: the "Run ZAR Audit"
    // button disables on isAuditing, but that disable only takes effect after
    // React commits a re-render. A rapid double-click/double-tap (or any other
    // future call site) can fire twice before that commit lands. Checking
    // get().isAuditing here is a synchronous read-then-set with no await in
    // between, so a second overlapping call is rejected immediately —
    // regardless of render timing.
    if (get().isAuditing) return false;

    set({ isAuditing: true, error: null });
    try {
      const { employees } = get();
      const summary = summarize(employees);
      const topFiveJson = JSON.stringify(
        summary.topFive.map((e) => ({
          employeeId: e.employeeId,
          name: e.name,
          division: e.divisionId,
          liabilityZar: e.liabilityZar,
        })),
      );
      await runFlow(AUDIT_FLOW_ID, {
        totalLiability: summary.totalLiability,
        employeesCount: summary.employeesCount,
        criticalCount: summary.criticalCount,
        topFiveJson,
        auditDate: new Date().toISOString().slice(0, 10),
      });
      set({ isAuditing: false, lastAuditAt: new Date().toISOString() });
      return true;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Audit failed to run', isAuditing: false });
      return true; // it did run (and failed) — distinct from the duplicate-rejection case above
    }
  },
}));
