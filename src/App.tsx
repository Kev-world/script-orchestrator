import React, { useState, useEffect } from 'react';
import { Persona, PipelineExecutionState, RunbookTool, PullRequest } from './types';
import { INITIAL_RUNBOOKS, INITIAL_PRS } from './mockData';
import { Header } from './components/Header';
import { PipelineTracker } from './components/PipelineTracker';
import { BilingualReport } from './components/BilingualReport';
import { RunbookRegistryView } from './components/RunbookRegistryView';
import { PullRequestsView } from './components/PullRequestsView';
import { AdrSpecView } from './components/AdrSpecView';
import { TelemetryComparisonModal } from './components/TelemetryComparisonModal';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Search, 
  GitPullRequest, 
  CheckCircle2, 
  Database,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Send,
  Loader2,
  SlidersHorizontal,
  Flame
} from 'lucide-react';

const PRESETS = [
  {
    id: 'preset_pdf',
    title: 'Acme Corp • PDF Export 504 Timeout',
    tag: 'Path A: Matched (92%)',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    prompt: 'Acme Corp is reporting that export to PDF has been failing with 504 gateway timeout for the last 30 minutes',
    expectedService: 'billing-exporter'
  },
  {
    id: 'preset_stripe',
    title: 'Globex Inc • Stripe Webhook Drops',
    tag: 'Path B: Tool Synthesis (< 0.75)',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
    prompt: 'Globex Inc says webhook notifications for Stripe invoice payments stopped arriving about 15 minutes ago',
    expectedService: 'billing-stripe-ingress'
  },
  {
    id: 'preset_db',
    title: 'Stark Industries • DB Lock Starvation',
    tag: 'Path A: Matched (88%)',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    prompt: 'Stark Industries reports database lock errors when saving dashboard widgets over the last 20 minutes',
    expectedService: 'db-connection-pool'
  }
];

export default function App() {
  const [persona, setPersona] = useState<Persona>('customer_success');
  const [activeTab, setActiveTab] = useState<'triage' | 'runbooks' | 'prs' | 'adr_spec'>('triage');
  const [prompt, setPrompt] = useState(PRESETS[0].prompt);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [showTelemetryModal, setShowTelemetryModal] = useState(false);

  const [tools, setTools] = useState<RunbookTool[]>(INITIAL_RUNBOOKS);
  const [prs, setPrs] = useState<PullRequest[]>(INITIAL_PRS);

  const [pipelineState, setPipelineState] = useState<PipelineExecutionState>({
    step: 'idle',
    isSynthesizingTool: false,
  });

  // Fetch initial tools and PRs from backend API
  useEffect(() => {
    fetch('/api/tools')
      .then(res => res.json())
      .then(data => {
        if (data.tools) setTools(data.tools);
      })
      .catch(() => {});

    fetch('/api/prs')
      .then(res => res.json())
      .then(data => {
        if (data.prs) setPrs(data.prs);
      })
      .catch(() => {});
  }, []);

  // Run the full investigation pipeline
  const runInvestigation = async (queryText?: string) => {
    const textToRun = queryText || prompt;
    if (!textToRun.trim()) return;

    setIsLoading(true);
    setLoadingStep('Layer 1: Resolving customer entity & context...');

    try {
      // Step visual feedback
      setPipelineState(prev => ({
        ...prev,
        step: 'layer1_entity',
      }));

      const res = await fetch('/api/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToRun, persona }),
      });

      if (!res.ok) {
        throw new Error('Failed to run investigation');
      }

      const data = await res.json();

      // Update pipeline state with data
      setPipelineState({
        step: 'completed',
        isSynthesizingTool: data.isSynthesizingTool,
        matchedTool: data.matchedTool,
        entityContext: data.entityContext,
        routingPath: data.routingPath,
        relevanceScore: data.relevanceScore,
        executionMetrics: data.executionMetrics,
        report: data.report,
        openedPr: data.openedPr,
      });

      // Refresh tools and PRs
      if (data.openedPr) {
        setPrs(prev => [data.openedPr, ...prev.filter(p => p.id !== data.openedPr.id)]);
      }
      if (data.matchedTool) {
        setTools(prev => [data.matchedTool, ...prev.filter(t => t.id !== data.matchedTool.id)]);
      }
    } catch (err) {
      console.error("Investigation error:", err);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  // Run preset automatically on first load to show immediate value
  useEffect(() => {
    runInvestigation(PRESETS[0].prompt);
  }, []);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setPrompt(preset.prompt);
    runInvestigation(preset.prompt);
  };

  const handleMergePr = async (prId: string) => {
    try {
      const res = await fetch(`/api/prs/${prId}/merge`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPrs(prev => prev.map(p => p.id === prId ? { ...p, status: 'MERGED' } : p));
        setTools(prev => prev.map(t => t.id === data.tool?.id ? { ...t, isCertified: true, isQuarantined: false } : t));
        if (pipelineState.matchedTool?.id === data.tool?.id) {
          setPipelineState(prev => ({
            ...prev,
            matchedTool: { ...prev.matchedTool!, isCertified: true, isQuarantined: false }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCertifyTool = async (toolId: string) => {
    try {
      const res = await fetch(`/api/tools/${toolId}/certify`, { method: 'POST' });
      if (res.ok) {
        setTools(prev => prev.map(t => t.id === toolId ? { ...t, isCertified: true, isQuarantined: false } : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openPrCount = prs.filter(p => p.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-stone-100/60 text-stone-900 flex flex-col font-sans selection:bg-stone-200">
      {/* Navigation Header */}
      <Header
        currentPersona={persona}
        onSelectPersona={setPersona}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        prCount={openPrCount}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: LIVE TRIAGE */}
        {activeTab === 'triage' && (
          <div className="space-y-6">
            {/* Context & Role Banner */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                    ADR-042 Decoupled Architecture
                  </span>
                  <span className="text-stone-300">•</span>
                  <span className="text-xs font-semibold text-stone-800">
                    Active Persona: {persona === 'customer_success' ? 'Customer Success / Sales' : 'SRE / Incident Commander'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  {persona === 'customer_success' 
                    ? 'Non-technical mode: Triage customer inquiries in < 1 min with polite, copy-paste ready explanations without paging SRE.'
                    : 'Engineering mode: Full access to deterministic Python runbooks, ephemeral sandbox execution logs, and automated PR review.'}
                </p>
              </div>

              <button
                id="btn-inspect-telemetry"
                onClick={() => setShowTelemetryModal(true)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center space-x-1.5 transition-colors shrink-0"
              >
                <Cpu className="w-3.5 h-3.5 text-stone-500" />
                <span>Raw vs Compressed Telemetry</span>
              </button>
            </div>

            {/* Quick Presets Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Real-World ADR-042 Incident Scenarios (Click to test Path A or Path B):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      prompt === preset.prompt
                        ? 'border-stone-900 bg-white shadow-xs ring-1 ring-stone-900'
                        : 'border-stone-200 bg-white hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-stone-900 truncate">
                        {preset.title}
                      </span>
                    </div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${preset.tagColor}`}>
                      {preset.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Prompt Input Bar */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
              <label className="block text-xs font-bold text-stone-700 mb-2">
                Incident Description or Customer Ticket:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="input-incident-prompt"
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && runInvestigation()}
                    placeholder="e.g. Acme Corp PDF export fails with 504 for the last 30 minutes..."
                    className="w-full pl-3 pr-10 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:border-stone-900 font-mono text-stone-800"
                  />
                  {prompt && (
                    <button
                      onClick={() => setPrompt('')}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  id="btn-run-investigation"
                  onClick={() => runInvestigation()}
                  disabled={isLoading || !prompt.trim()}
                  className="px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition-colors shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{loadingStep || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Investigate Incident</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Pipeline Execution Flow Tracker */}
            <PipelineTracker
              state={pipelineState}
              onOpenPr={(prId) => setActiveTab('prs')}
              onViewScript={() => setActiveTab('runbooks')}
            />

            {/* Bilingual Report Artifact (Section 4 Schema) */}
            {pipelineState.report && (
              <BilingualReport
                report={pipelineState.report}
                persona={persona}
              />
            )}
          </div>
        )}

        {/* TAB 2: RUNBOOK REGISTRY */}
        {activeTab === 'runbooks' && (
          <RunbookRegistryView
            tools={tools}
            onCertifyTool={handleCertifyTool}
            persona={persona}
          />
        )}

        {/* TAB 3: PR QUEUE */}
        {activeTab === 'prs' && (
          <PullRequestsView
            prs={prs}
            onMergePr={handleMergePr}
            persona={persona}
          />
        )}

        {/* TAB 4: ADR-042 SPEC */}
        {activeTab === 'adr_spec' && (
          <AdrSpecView />
        )}
      </main>

      {/* Telemetry Modal Comparison */}
      <TelemetryComparisonModal
        isOpen={showTelemetryModal}
        onClose={() => setShowTelemetryModal(false)}
        metrics={pipelineState.executionMetrics}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-4 px-6 text-center text-xs text-stone-500 font-mono">
        ADR-042 Reference Architecture • Decoupled Deterministic Runbooks • Autonomous Tool Synthesis • Bilingual Dual-Layer Synthesis
      </footer>
    </div>
  );
}
