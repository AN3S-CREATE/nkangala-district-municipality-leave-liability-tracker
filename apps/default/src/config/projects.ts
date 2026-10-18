/**
 * Taskade project ids backing the Leave Liability system.
 */
export const LEDGER_PROJECT_ID = 'qQEiUbSedm69y2S8';
export const AUDIT_LOG_PROJECT_ID = 'fmH5r52F8bTY4Qob';

export const AUDIT_FLOW_ID = '01KWMW3G6NAK7DQS4ED02ZSCPT';

/** Cost Centre / Division select field option ids -> labels (must match the project schema). */
export const DIVISIONS: Array<{ id: string; label: string }> = [
  { id: 'mmo', label: 'Office of the Municipal Manager' },
  { id: 'cds', label: 'Corporate Services' },
  { id: 'bts', label: 'Budget & Treasury' },
  { id: 'cs', label: 'Community Services' },
  { id: 'ts', label: 'Technical Services' },
  { id: 'ippd', label: 'Infrastructure, Planning & Development' },
  { id: 'led', label: 'Local Economic Development & Tourism' },
];

export const CRITICAL_THRESHOLD_ZAR = 50000;
