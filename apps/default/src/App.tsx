import * as React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Upload, Download, Building2, RefreshCw, FileText, LogOut, LogIn, Shield, AlertTriangle, X, Phone, Clock, Search, Facebook, Twitter, Youtube } from 'lucide-react';
import { GenesisAuth } from '@/lib/genesis-auth';
import { useAuth } from 'react-oidc-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import { useLedgerStore } from '@/store/useLedgerStore';
import { KpiCards } from '@/components/leave/KpiCards';
import { LedgerTable } from '@/components/leave/LedgerTable';
import { RiskBoard } from '@/components/leave/RiskBoard';
import { AuditPanel } from '@/components/leave/AuditPanel';
import { EmployeeFormDialog } from '@/components/leave/EmployeeFormDialog';
import { CsvImportDialog } from '@/components/leave/CsvImportDialog';
import { AgentChatPanel } from '@/components/leave/AgentChatPanel';
import { ThemeToggle } from '@/components/leave/ThemeToggle';
import { DocumentWorkspace } from '@/components/documents/DocumentWorkspace';
import { exportEmployeesToCsv, downloadCsv } from '@/lib/csv';
import type { Employee } from '@/lib/leaveLogic';
import type { EmployeeInput } from '@/lib/employeeData';

function ProtectedApp() {
  const auth = useAuth();
  const ownerId = auth.user?.profile?.sub;
  const {
    employees,
    summary,
    isLoading,
    error,
    isAuditing,
    lastAuditAt,
    fetchAll,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    bulkImport,
    runAudit,
  } = useLedgerStore();

  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Employee | null>(null);
  const [activeMainNav, setActiveMainNav] = React.useState<string>('leave');

  React.useEffect(() => {
    document.title = 'NKANGALA District Municipality — Leave Liability';
  }, []);

  React.useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  React.useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (e: Employee) => {
    setEditing(e);
    setFormOpen(true);
  };

  const handleSubmit = async (input: EmployeeInput) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateEmployee(editing.id, input, ownerId);
        toast.success('Employee updated');
      } else {
        await createEmployee(input, ownerId);
        toast.success('Employee added');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmployee(deleteTarget.id);
      toast.success('Employee removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleImport = async (rows: EmployeeInput[]) => {
    const result = await bulkImport(rows, ownerId);
    if (result.rejected) {
      toast.info('Import already in progress — hang tight, one run at a time.');
      return result;
    }
    if (result.succeeded > 0) {
      toast.success(`Imported ${result.succeeded} employee(s)`);
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} row(s) failed to import`);
    }
    return result;
  };

  const handleExport = () => {
    const csv = exportEmployeesToCsv(employees);
    downloadCsv(`nkangala-leave-liability-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success('CSV exported — ready for local archiving');
  };

  const handleRunAudit = async () => {
    const started = await runAudit();
    if (!started) {
      toast.info('Audit already in progress — hang tight, one run at a time.');
      return;
    }
    toast.success('ZAR Liability Audit dispatched — executive summary will be logged shortly');
  };

  const userDisplayName = auth.user?.profile?.name ?? auth.user?.profile?.preferred_username ?? auth.user?.profile?.email ?? 'Municipality Officer';

  const hasErrorBanner = error !== null;

  const mainNavItems = [
    { id: 'leave', label: 'Leave Liability', icon: Building2 },
    { id: 'documents', label: 'Document Workspace', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ===== TOP UTILITY BAR (bright olive-green) ===== */}
      <div className="bg-[hsl(var(--topbar-green))] text-[hsl(var(--topbar-green-foreground))]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs font-medium sm:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3" />
              <span>013 243 2253</span>
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Clock className="size-3" />
              <span>Mon-Fri: 08:00 — 16:00</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <Shield className="size-3" />
              <span className="hidden sm:inline">{userDisplayName}</span>
            </span>
            <span className="mx-1 hidden h-4 w-px bg-white/30 sm:block" />
            <div className="flex items-center gap-0.5">
              <a href="#" className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25" aria-label="Facebook">
                <Facebook className="size-3" />
              </a>
              <a href="#" className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25" aria-label="Twitter">
                <Twitter className="size-3" />
              </a>
              <a href="#" className="flex size-6 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25" aria-label="YouTube">
                <Youtube className="size-3" />
              </a>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* ===== MAIN HEADER (white with municipal crest + nav) ===== */}
      <header className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
          {/* Logo / Crest area */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[hsl(var(--forest))] sm:size-11">
              <Building2 className="size-5 text-white sm:size-6" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase leading-tight tracking-wide text-[hsl(var(--forest))]">
                NKANGALA District
              </p>
              <p className="text-[10px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground">
                Municipality
              </p>
              <p className="text-[9px] leading-tight text-muted-foreground/70">
                HR — Leave Liability Provisioning
              </p>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {mainNavItems.map((item) => {
              const isActive = activeMainNav === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMainNav(item.id)}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[hsl(var(--gold))] text-black shadow-sm'
                      : 'text-foreground hover:bg-[hsl(var(--gold))]/15 hover:text-[hsl(var(--forest))]'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden text-xs text-muted-foreground sm:block">
              <span className="font-medium text-[hsl(var(--forest))]">District of Excellence</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void fetchAll()}
              aria-label="Refresh data"
              className="text-muted-foreground hover:text-[hsl(var(--forest))]"
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-[hsl(var(--forest))] text-white hover:bg-[hsl(var(--forest-dark))]"
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => auth.signoutRedirect()}
              aria-label="Sign out"
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>

        {/* Mobile tabs row */}
        <div className="flex border-t md:hidden">
          {mainNavItems.map((item) => {
            const isActive = activeMainNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMainNav(item.id)}
                className={`flex-1 py-2.5 text-center text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-b-2 border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--forest))]'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* ===== ERROR BANNER ===== */}
      {hasErrorBanner && (
        <div className="flex items-start gap-3 border-b border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Data loading error</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={() => void fetchAll()}
            aria-label="Retry loading data"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Page breadcrumb bar */}
        <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--muted))] px-4 py-2.5 text-xs text-muted-foreground">
          <Building2 className="size-3" />
          <span>/</span>
          <span className="font-semibold text-[hsl(var(--forest))]">HR Leave Liability Provisioning</span>
          <span>/</span>
          <span>{activeMainNav === 'documents' ? 'Document Workspace' : 'Employee Ledger'}</span>
        </div>

        {activeMainNav === 'leave' ? (
          <div className="space-y-6">
            <KpiCards summary={summary} isLoading={isLoading && employees.length === 0} />

            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm border">
              <Button onClick={handleAdd} className="bg-[hsl(var(--forest))] hover:bg-[hsl(var(--forest-dark))] text-white">
                <Plus className="size-4" />
                Add Employee
              </Button>
              <Button variant="outline" onClick={() => setCsvOpen(true)} className="border-[hsl(var(--forest))]/30 text-[hsl(var(--forest))] hover:bg-[hsl(var(--forest))]/5">
                <Upload className="size-4" />
                Import CSV
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={employees.length === 0} className="border-[hsl(var(--gold))]/40 text-foreground hover:bg-[hsl(var(--gold))]/10">
                <Download className="size-4" />
                Export CSV
              </Button>
            </div>

            <Tabs defaultValue="table" className="w-full">
              <TabsList className="bg-[hsl(var(--muted))] p-1">
                <TabsTrigger value="table" className="data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">Master Table</TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">Risk Dashboard</TabsTrigger>
                <TabsTrigger value="audit" className="data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">ZAR Audit</TabsTrigger>
              </TabsList>

              <TabsContent value="table" className="mt-4">
                <LedgerTable
                  employees={employees}
                  isLoading={isLoading}
                  onEdit={handleEdit}
                  onDelete={(e) => setDeleteTarget(e)}
                />
              </TabsContent>

              <TabsContent value="risk" className="mt-4">
                <RiskBoard employees={employees} />
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <AuditPanel
                  summary={summary}
                  isAuditing={isAuditing}
                  lastAuditAt={lastAuditAt}
                  onRunAudit={() => void handleRunAudit()}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <DocumentWorkspace />
        )}
      </main>

      <EmployeeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
      <CsvImportDialog open={csvOpen} onOpenChange={setCsvOpen} onImport={handleImport} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border bg-background p-5 shadow-xl">
            <h2 className="font-semibold">Remove {deleteTarget.name}?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This permanently removes the employee from the leave ledger. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void handleDeleteConfirmed()}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <AgentChatPanel />
    </div>
  );
}

/**
 * Auth gate — shows a branded loading screen while the OIDC session is
 * initializing. Three states:
 *   1. Loading   — OIDC discovery in progress
 *   2. Error     — discovery failed (auth not configured in app settings)
 *   3. Signed-in — ProtectedApp
 *
 * The sign-in prompt is handled natively by the OIDC provider redirect;
 * we render nothing special for the unauthenticated state — the provider
 * auto-redirects to the hosted login page.
 */
function AuthGate() {
  const auth = useAuth();
  const isLoading = auth.isLoading;
  const hasError = auth.error !== undefined;

  React.useEffect(() => {
    document.title = 'NKANGALA District Municipality — Leave Liability';
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
        <div className="bg-[hsl(var(--topbar-green))] px-4 py-2">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-white">
            <Phone className="size-3" />
            <span>013 243 2253</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-[hsl(var(--forest))] shadow-lg">
            <Building2 className="size-10 text-white" />
          </div>
          <div className="space-y-3 text-center">
            <h1 className="text-2xl font-extrabold text-[hsl(var(--forest))]">
              NKANGALA District Municipality
            </h1>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              District of Excellence & Climate Smart Innovation
            </p>
            <div className="flex justify-center gap-1 pt-4">
              <Skeleton className="h-2 w-20 rounded-full" />
              <Skeleton className="h-2 w-14 rounded-full" />
              <Skeleton className="h-2 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    const errMsg =
      auth.error instanceof Error ? auth.error.message : String(auth.error);
    return (
      <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
        <div className="bg-[hsl(var(--topbar-green))] px-4 py-2">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-white">
            <Phone className="size-3" />
            <span>013 243 2253</span>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-destructive/20 shadow-lg">
            <AlertTriangle className="size-10 text-destructive" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-extrabold text-destructive">
              Sign-in Error
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Authentication failed. This can happen after a new registration if the
              session was not fully established.
            </p>
            <p className="max-w-sm rounded bg-muted px-3 py-2 text-xs text-muted-foreground font-mono break-all">
              {errMsg}
            </p>
          </div>
          <Button
            onClick={() => {
              void auth.removeUser();
              void auth.signinRedirect();
            }}
            size="lg"
            className="gap-2 bg-[hsl(var(--forest))] font-bold text-white shadow-md transition-all hover:bg-[hsl(var(--forest-dark))] hover:shadow-lg"
          >
            <RefreshCw className="size-4" />
            Retry sign-in
          </Button>
          <p className="text-xs text-muted-foreground">
            If this persists, contact your system administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
        <div className="bg-[hsl(var(--topbar-green))] px-4 py-2">
          <div className="mx-auto flex max-w-7xl items-center gap-2 text-xs text-white">
            <Phone className="size-3" />
            <span>013 243 2253</span>
            <span className="ml-4 hidden sm:inline">
              <Clock className="mr-1 inline size-3" />
              Mon-Fri: 08:00 — 16:00
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
          <div className="flex size-20 items-center justify-center rounded-full bg-[hsl(var(--forest))] shadow-lg">
            <Shield className="size-10 text-white" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-extrabold text-[hsl(var(--forest))]">
              NKANGALA District Municipality
            </h1>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              HR Leave Liability Provisioning
            </p>
            <p className="max-w-sm pt-2 text-sm text-muted-foreground">
              This system contains confidential employee data protected under POPIA.
              Please sign in to continue.
            </p>
          </div>
          <Button
            onClick={() => void auth.signinRedirect()}
            size="lg"
            className="gap-2 bg-[hsl(var(--gold))] font-bold text-black shadow-md transition-all hover:bg-[hsl(var(--gold-hover))] hover:shadow-lg"
          >
            <LogIn className="size-4" />
            Sign in to continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ProtectedApp />
    </ErrorBoundary>
  );
}

const App: React.FC = function App() {
  return (
    <>
      <GenesisAuth>
        <AuthGate />
      </GenesisAuth>
      <Toaster />
    </>
  );
};

export default App;
