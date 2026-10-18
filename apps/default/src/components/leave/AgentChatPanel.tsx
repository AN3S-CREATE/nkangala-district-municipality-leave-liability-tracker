import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, ScanSearch, BookOpenCheck } from 'lucide-react';
import { AgentChatBody, type AgentChatConfig } from '@/components/leave/AgentChatBody';
import {
  AGENT_ID,
  AGENT_NAME,
  AGENT_PUBLIC_URL,
  HELPER_AGENT_ID,
  HELPER_AGENT_NAME,
  HELPER_AGENT_PUBLIC_URL,
} from '@/config/agent';

const AUDITOR_CONFIG: AgentChatConfig = {
  agentId: AGENT_ID,
  agentName: AGENT_NAME,
  publicUrl: AGENT_PUBLIC_URL,
  description: "Ask about the municipality's leave liability exposure.",
  icon: ScanSearch,
  starters: [
    'Run a full ZAR liability audit now and log the results.',
    'Who are the top 5 highest-liability employees right now, in ZAR?',
    'Which Cost Centre / Division is hoarding the most leave liability?',
  ],
};

const HELPER_CONFIG: AgentChatConfig = {
  agentId: HELPER_AGENT_ID,
  agentName: HELPER_AGENT_NAME,
  publicUrl: HELPER_AGENT_PUBLIC_URL,
  description: 'CSV import help and South African (BCEA) leave law & filing guidance.',
  icon: BookOpenCheck,
  starters: [
    'What columns and format does my CSV need to import employees successfully?',
    'My CSV import failed on a few rows — what are the most common reasons?',
    'How much annual leave is an employee entitled to under the BCEA?',
  ],
};

const TABS = [
  { key: 'auditor', config: AUDITOR_CONFIG },
  { key: 'helper', config: HELPER_CONFIG },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function AgentChatPanel() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('auditor');

  const activeConfig = TABS.find((t) => t.key === activeTab)?.config ?? AUDITOR_CONFIG;

  return (
    <>
      <Button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-40 size-14 rounded-full bg-[hsl(var(--gold))] text-black shadow-lg transition-transform duration-300 hover:scale-105 hover:bg-[hsl(var(--gold-hover))]"
        size="icon"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>

      {open && (
        <>
          <button
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm sm:hidden"
          />
          <div className="fixed inset-0 z-40 flex flex-col bg-background sm:inset-auto sm:bottom-24 sm:right-5 sm:h-[600px] sm:w-[400px] sm:rounded-xl sm:border sm:shadow-2xl">
            <div className="flex items-center justify-between border-b bg-[hsl(var(--forest))] px-4 py-3 text-white sm:rounded-t-xl">
              <div>
                <p className="text-sm font-bold">{activeConfig.agentName}</p>
                <p className="text-xs text-white/70">NKANGALA District Municipality</p>
              </div>
              <Button size="icon" variant="ghost" className="size-8 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="flex shrink-0 border-b bg-white">
              {TABS.map((t) => {
                const Icon = t.config.icon;
                const isActive = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold transition-colors ${
                      isActive
                        ? 'border-b-[3px] border-[hsl(var(--gold))] text-[hsl(var(--forest))] bg-[hsl(var(--gold))]/10'
                        : 'border-b-[3px] border-transparent text-muted-foreground hover:text-[hsl(var(--forest))]'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {t.config.agentName}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-hidden">
              {/* Keying by tab remounts AgentChatBody per agent so switching tabs
                  never mixes messages from one agent's conversation into another's. */}
              <AgentChatBody key={activeTab} config={activeConfig} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
