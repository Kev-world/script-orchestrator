import React from 'react';
import { PipelineExecutionState } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  Cpu, 
  FileCode2, 
  GitPullRequest, 
  Layers, 
  Shield, 
  Sparkles, 
  ArrowRight,
  Database,
  Lock
} from 'lucide-react';

interface PipelineTrackerProps {
  state: PipelineExecutionState;
  onOpenPr?: (prId: string) => void;
  onViewScript?: () => void;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({
  state,
  onOpenPr,
  onViewScript,
}) => {
  const isPathB = state.routingPath?.includes('Path B') || state.isSynthesizingTool;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-100">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-stone-700" />
          <h2 className="text-sm font-semibold text-stone-900 tracking-tight">
            ADR-042 Multi-Tier Execution Pipeline
          </h2>
        </div>
        <div className="flex items-center space-x-3 text-xs text-stone-500 font-mono">
          <span className="flex items-center">
            <Lock className="w-3 h-3 mr-1 text-emerald-600" /> Scoped Read-Only Token
          </span>
          <span className="hidden md:inline text-stone-300">•</span>
          <span className="flex items-center">
            <Shield className="w-3 h-3 mr-1 text-emerald-600" /> PII Regex Scrubber Active
          </span>
        </div>
      </div>

      {/* Grid of the 4 Pipeline Layers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {/* Layer 1: Entity & Context Resolver */}
        <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Layer 1: Resolver
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-stone-800 mb-1">
              Entity &amp; Context
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
              Maps business terms to technical parameters.
            </p>
          </div>

          {state.entityContext ? (
            <div className="bg-white border border-stone-200 rounded-md p-2 space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-800">{state.entityContext.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tenant ID:</span>
                <span className="text-indigo-600 font-semibold">{state.entityContext.tenantId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Service:</span>
                <span className="text-stone-800">{state.entityContext.targetService}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Window:</span>
                <span className="text-stone-700">{state.entityContext.relativeTime}</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-stone-400 italic">Awaiting prompt...</div>
          )}
        </div>

        {/* Layer 2: Tool Registry & Router */}
        <div className={`border rounded-lg p-3 flex flex-col justify-between transition-all ${
          isPathB
            ? 'border-amber-300 bg-amber-50/40'
            : 'border-stone-200 bg-stone-50/70'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Layer 2: Router
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-stone-800 mb-1">
              Tool Registry &amp; Routing
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
              {isPathB 
                ? 'Score < 0.75: Self-Evolution (Tool Builder Mode) triggered.'
                : 'Score ≥ 0.75: Matched existing certified runbook.'}
            </p>
          </div>

          {state.matchedTool ? (
            <div className="space-y-1.5">
              <div className="bg-white border border-stone-200 rounded-md p-2 text-[11px]">
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    isPathB ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isPathB ? 'Path B: Synthesized' : 'Path A: Matched'}
                  </span>
                  <span className="text-stone-500 font-mono text-[10px]">
                    Match: {Math.round((state.relevanceScore || 0.85) * 100)}%
                  </span>
                </div>
                <div className="font-mono text-stone-800 font-semibold truncate text-[11px]" title={state.matchedTool.filename}>
                  {state.matchedTool.filename}
                </div>
              </div>

              {state.openedPr && (
                <button
                  onClick={() => onOpenPr && onOpenPr(state.openedPr!.id)}
                  className="w-full text-left bg-amber-100/70 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-md p-1.5 text-[10px] font-medium flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center space-x-1 truncate">
                    <GitPullRequest className="w-3 h-3 text-amber-700 shrink-0" />
                    <span className="truncate">PR #{state.openedPr.prNumber}: Quarantined</span>
                  </span>
                  <ArrowRight className="w-3 h-3 shrink-0 ml-1 text-amber-700" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-stone-400 italic">Awaiting prompt...</div>
          )}
        </div>

        {/* Layer 3: Deterministic Execution Engine */}
        <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Layer 3: Execution
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-stone-800 mb-1">
              Deterministic Engine
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
              Read-only aggregate queries. Never feeds raw logs to LLM.
            </p>
          </div>

          {state.executionMetrics ? (
            <div className="bg-white border border-stone-200 rounded-md p-2 space-y-1 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500">Execution:</span>
                <span className="text-emerald-700 font-semibold">{state.executionMetrics.execution_time_ms}ms (Exit 0)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">PII Scrubbed:</span>
                <span className="text-stone-800 font-semibold">{state.executionMetrics.sanitized_pii_count} fields</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Raw Scanned:</span>
                <span className="text-stone-800 font-semibold">{(state.executionMetrics.raw_bytes_scanned / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Token Reduction:</span>
                <span className="text-emerald-600 font-bold">{state.executionMetrics.token_reduction_percent}%</span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-stone-400 italic">Awaiting prompt...</div>
          )}
        </div>

        {/* Layer 4: Bilingual AI Synthesizer */}
        <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                Layer 4: Synthesizer
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-stone-800 mb-1">
              Bilingual AI Synthesizer
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed mb-2">
              2-stage reasoning: Stage 1 (Technical Truth) $\to$ Stage 2 (Customer View).
            </p>
          </div>

          {state.report ? (
            <div className="bg-white border border-stone-200 rounded-md p-2 space-y-1 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono">Stage 1 SRE:</span>
                <span className="text-xs font-semibold text-stone-800 font-mono">Grounded</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-mono">Stage 2 CS:</span>
                <span className="text-xs font-semibold text-emerald-700 font-mono">Scrubbed</span>
              </div>
              <div className="pt-1 border-t border-stone-100 flex items-center justify-between">
                <span className="text-stone-500 text-[10px]">Status:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {state.report.business_layer.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-stone-400 italic">Awaiting prompt...</div>
          )}
        </div>
      </div>
    </div>
  );
};
