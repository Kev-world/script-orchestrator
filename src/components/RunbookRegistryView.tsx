import React, { useState } from 'react';
import { RunbookTool, Persona } from '../types';
import { 
  CheckCircle, 
  Code2, 
  Copy, 
  FileCode, 
  Search, 
  ShieldAlert, 
  Sparkles, 
  Terminal,
  Clock,
  Activity,
  Check
} from 'lucide-react';

interface RunbookRegistryViewProps {
  tools: RunbookTool[];
  onCertifyTool: (id: string) => void;
  persona: Persona;
}

export const RunbookRegistryView: React.FC<RunbookRegistryViewProps> = ({
  tools,
  onCertifyTool,
  persona,
}) => {
  const [selectedToolId, setSelectedToolId] = useState<string>(tools[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  const filteredTools = tools.filter(
    t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.targetService.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTool = tools.find(t => t.id === selectedToolId) || tools[0];

  const handleCopyCode = () => {
    if (!selectedTool) return;
    navigator.clipboard.writeText(selectedTool.pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-stone-900">
                Deterministic Runbook Registry
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-stone-200 text-stone-700">
                {tools.length} Runbooks
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              All scripts subclass <code className="text-indigo-600 font-mono">BaseLogTool</code> and emit compressed metrics. Direct shell execution is strictly prohibited.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or service..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Main split: List on left, Python code on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* Runbook Tool List */}
        <div className="lg:col-span-5 border-r border-stone-200 divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
          {filteredTools.map((tool) => {
            const isSelected = tool.id === selectedTool?.id;
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedToolId(tool.id)}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-stone-100/80 border-l-4 border-stone-900' : 'hover:bg-stone-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-mono text-xs font-bold text-stone-900 truncate">
                    {tool.filename}
                  </div>
                  <div>
                    {tool.isCertified ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        Certified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Quarantined
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-600 line-clamp-2 mb-2 leading-relaxed">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span className="flex items-center">
                    <Terminal className="w-3 h-3 mr-1 text-stone-400" />
                    {tool.targetService}
                  </span>
                  <span className="flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-stone-400" />
                    {tool.executionCount} runs
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Tool Code Viewer */}
        <div className="lg:col-span-7 p-4 sm:p-6 bg-stone-900 text-stone-100 flex flex-col justify-between">
          {selectedTool ? (
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">
                      {selectedTool.filename}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300">
                      Author: {selectedTool.author}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400 block mt-0.5">
                    Target: {selectedTool.targetService}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {!selectedTool.isCertified && persona === 'sre_engineer' && (
                    <button
                      onClick={() => onCertifyTool(selectedTool.id)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Certify &amp; Merge</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopyCode}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono flex items-center space-x-1"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {selectedTool.isQuarantined && (
                <div className="mb-3 p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Quarantined Script:</span> Autonomously synthesized by ADR-042 Tool Builder Mode. Non-technical users are blocked from direct invocation until certified by SRE.
                  </div>
                </div>
              )}

              <pre className="font-mono text-xs text-stone-200 overflow-x-auto leading-relaxed bg-stone-950/70 p-4 rounded-lg border border-stone-800 max-h-[460px]">
                {selectedTool.pythonCode}
              </pre>
            </div>
          ) : (
            <div className="text-stone-500 text-xs italic">Select a runbook to inspect source code.</div>
          )}

          <div className="pt-3 border-t border-stone-800 mt-4 flex items-center justify-between text-[11px] text-stone-400 font-mono">
            <span>Read-only SDK tokens enforced</span>
            <span>Max query window: 60 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
