import React, { useState } from 'react';
import { PullRequest, Persona } from '../types';
import { 
  GitPullRequest, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  GitMerge, 
  FileCode2, 
  Check, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';

interface PullRequestsViewProps {
  prs: PullRequest[];
  onMergePr: (id: string) => void;
  persona: Persona;
}

export const PullRequestsView: React.FC<PullRequestsViewProps> = ({
  prs,
  onMergePr,
  persona,
}) => {
  const [mergingId, setMergingId] = useState<string | null>(null);

  const handleMerge = async (id: string) => {
    setMergingId(id);
    await onMergePr(id);
    setMergingId(null);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-stone-900">
                Self-Evolving Runbook Pull Requests
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-amber-100 text-amber-800 font-semibold">
                Flywheel Knowledge Base
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              When routing relevance is &lt; 0.75, the AI writes and sandboxes a new Python tool, registering it locally as quarantined and opening a Pull Request for human review.
            </p>
          </div>

          <div className="text-xs font-mono bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-stone-700">
            Target Repo: <span className="font-semibold text-stone-900">runbooks/</span>
          </div>
        </div>
      </div>

      {/* PR Cards List */}
      <div className="p-4 sm:p-6 space-y-4">
        {prs.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-xs">
            No active pull requests. Trigger a novel incident investigation to watch the AI synthesize a new runbook tool!
          </div>
        ) : (
          prs.map((pr) => {
            const isOpen = pr.status === 'OPEN';
            return (
              <div
                key={pr.id}
                className={`border rounded-xl p-4 sm:p-5 transition-all ${
                  isOpen
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-stone-200 bg-stone-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1.5 rounded-lg ${
                      isOpen ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <GitPullRequest className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-stone-900">
                          #{pr.prNumber} {pr.title}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isOpen ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {pr.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-500 font-mono">
                        branch: {pr.branch} • Author: {pr.author}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    {isOpen ? (
                      persona === 'sre_engineer' ? (
                        <button
                          onClick={() => handleMerge(pr.id)}
                          disabled={mergingId === pr.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
                        >
                          <GitMerge className="w-3.5 h-3.5" />
                          <span>{mergingId === pr.id ? 'Merging...' : 'Review & Merge to Runbooks'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-stone-500 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                          Requires SRE Persona to Merge
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Merged &amp; Certified in Production</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sandbox Test Result Block */}
                <div className="bg-white border border-stone-200 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-stone-800 flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sandbox Execution Test (gVisor Runner)</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-emerald-700 font-bold">
                      <Check className="w-3 h-3" />
                      <span>PASS (Timeout budget: {pr.sandboxTestResult.timeoutSeconds}s)</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] text-stone-600">
                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Test Duration</span>
                      <span className="font-semibold text-stone-800">{pr.sandboxTestResult.durationMs}ms</span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Exit Code</span>
                      <span className="font-semibold text-emerald-600">{pr.sandboxTestResult.exitCode} (Clean)</span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Diff</span>
                      <span className="font-semibold text-stone-800">{pr.diffSummary}</span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded">
                      <span className="text-stone-400 block text-[10px]">Contract Check</span>
                      <span className="font-semibold text-indigo-600">BaseLogTool OK</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
