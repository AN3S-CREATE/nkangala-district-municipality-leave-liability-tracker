import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { parseEmployeeCsv, type CsvParseResult } from '@/lib/csv';
import type { EmployeeInput } from '@/lib/employeeData';
import { UploadCloud, FileWarning, CheckCircle2 } from 'lucide-react';

export function CsvImportDialog({
  open,
  onOpenChange,
  onImport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: EmployeeInput[]) => Promise<{ succeeded: number; failed: number; rejected?: boolean }>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ succeeded: number; failed: number } | null>(null);

  const reset = () => {
    setParseResult(null);
    setFileName(null);
    setImportResult(null);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    setParseResult(parseEmployeeCsv(text));
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.rows.length === 0) return;
    setIsImporting(true);
    const result = await onImport(parseResult.rows);
    // A rejected (in-flight-guard) result did no work — leave any previous
    // importResult as-is instead of overwriting it with a misleading "0 imported".
    if (!result.rejected) {
      setImportResult(result);
    }
    setIsImporting(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Employees from CSV</DialogTitle>
          <DialogDescription>
            Columns: Employee ID, Employee Name, Cost Centre / Division, Daily Rate ZAR, Opening
            Bal, Accrual Rate, Less Taken, Less Forf / Payouts.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary hover:bg-muted/40"
        >
          <UploadCloud className="size-8 text-muted-foreground" />
          <span className="text-sm font-medium">{fileName ?? 'Click to choose a CSV file'}</span>
          <span className="text-xs text-muted-foreground">Frictionless bulk ingestion</span>
        </button>

        {parseResult && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              {parseResult.rows.length} row(s) ready to import
            </div>
            {parseResult.errors.length > 0 && (
              <div className="space-y-1">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <FileWarning className="mt-0.5 size-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {importResult && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            Imported <strong>{importResult.succeeded}</strong> employee(s)
            {importResult.failed > 0 ? `, ${importResult.failed} failed` : ''}.
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Close
          </Button>
          <Button
            type="button"
            disabled={!parseResult || parseResult.rows.length === 0 || isImporting}
            onClick={handleImport}
            className="bg-[hsl(var(--forest))] font-bold text-white hover:bg-[hsl(var(--forest-dark))]"
          >
            {isImporting ? 'Importing…' : `Import ${parseResult?.rows.length ?? 0} Row(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
