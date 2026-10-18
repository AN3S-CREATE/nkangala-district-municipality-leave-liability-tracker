import * as React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeft, Bot, FileText, AlertTriangle, BookOpen, Brain } from 'lucide-react';
import { DocumentChatPanel } from './DocumentChatPanel';
import { DocumentsTable } from './DocumentsTable';
import { GapReportsPanel } from './GapReportsPanel';
import { EvidencePanel } from './EvidencePanel';
import { KnowledgeBasePanel } from './KnowledgeBasePanel';
import { AGENTS } from '@/config/agents';

export function DocumentWorkspace() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [activeAgent, setActiveAgent] = React.useState<'expert' | 'gap' | 'research' | 'style'>('expert');

  const agentConfig = {
    expert: { id: AGENTS.expertAssistant.id, name: AGENTS.expertAssistant.name },
    gap: { id: AGENTS.gapAnalyzer.id, name: AGENTS.gapAnalyzer.name },
    research: { id: AGENTS.researchEvidence.id, name: AGENTS.researchEvidence.name },
    style: { id: AGENTS.styleCompliance.id, name: AGENTS.styleCompliance.name },
  };

  const currentAgent = agentConfig[activeAgent];

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0">
      {sidebarOpen && (
        <div className="flex w-80 shrink-0 flex-col border-r bg-white shadow-sm">
          <div className="flex items-center justify-between border-b bg-[hsl(var(--forest))] px-3 py-2.5 text-white">
            <div className="flex -space-x-1">
              {(['expert', 'gap', 'research', 'style'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveAgent(key)}
                  className={`flex size-8 items-center justify-center rounded-full border-2 border-white/20 transition-all ${
                    activeAgent === key
                      ? 'bg-[hsl(var(--gold))] text-black scale-110 z-10 shadow-md'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                  title={agentConfig[key].name}
                >
                  {key === 'expert' && <Bot className="size-4" />}
                  {key === 'gap' && <AlertTriangle className="size-4" />}
                  {key === 'research' && <BookOpen className="size-4" />}
                  {key === 'style' && <FileText className="size-4" />}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close panel"
            >
              <PanelLeftClose className="size-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <DocumentChatPanel agentId={currentAgent.id} agentName={currentAgent.name} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {!sidebarOpen && (
          <div className="absolute bottom-4 right-4 z-10">
            <Button
              size="icon"
              className="size-10 rounded-full bg-[hsl(var(--gold))] text-black shadow-lg hover:bg-[hsl(var(--gold-hover))]"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open AI panel"
            >
              <PanelLeft className="size-5" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="documents">
            <TabsList className="bg-[hsl(var(--muted))] p-1">
              <TabsTrigger value="documents" className="gap-1.5 data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">
                <FileText className="size-3.5" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="gaps" className="gap-1.5 data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">
                <AlertTriangle className="size-3.5" />
                Gap Reports
              </TabsTrigger>
              <TabsTrigger value="evidence" className="gap-1.5 data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">
                <BookOpen className="size-3.5" />
                Evidence
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-1.5 data-[state=active]:bg-[hsl(var(--gold))] data-[state=active]:text-black data-[state=active]:shadow-sm">
                <Brain className="size-3.5" />
                Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-4">
              <DocumentsTable />
            </TabsContent>

            <TabsContent value="gaps" className="mt-4">
              <GapReportsPanel />
            </TabsContent>

            <TabsContent value="evidence" className="mt-4">
              <EvidencePanel />
            </TabsContent>

            <TabsContent value="knowledge" className="mt-4">
              <KnowledgeBasePanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
