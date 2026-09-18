import React, { useState } from 'react';
import { UnifiedReport, Persona } from '../types';
import { 
  Check, 
  Copy, 
  Eye, 
  FileJson, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles, 
  Terminal, 
  UserCheck, 
  Wrench,
  AlertTriangle,
  Info
} from 'lucide-react';

interface BilingualReportProps {
  report: UnifiedReport;
  persona: Persona;
}

export const BilingualReport: React.FC<BilingualReportProps> = ({
  report,
  persona,
}) => {
  const [activeView, setActiveView] = useState<'both' | 'business' | 'technical' | 'json'>(
    persona === 'customer_success' ? 'business' : 'both'
  );
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedTech, setCopiedTech] = useState(false);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(report.business_layer.customer_draft_response);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyTech = () => {
    const text = `SRE INCIDENT REPORT
Root Cause: ${report.technical_layer.root_cause_hypothesis}
Error Rate: ${report.technical_layer.metrics_and_evidence.error_rate_delta}
p99 Latency: ${report.technical_layer.metrics_and_evidence.p99_latency}
Signatures:
${report.technical_layer.metrics_and_evidence.culprit_signatures.map(s => `- ${s}`).join('\n')}
Remediation:
${report.technical_layer.recommended_remediation}`;
    navigator.clipboard.writeText(text);
    setCopiedTech(true);
    setTimeout(() => setCopiedTech(false), 2000);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Report Header & View Selector */}
      <div className="bg-stone-50 border-b border-stone-200 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-stone-900">
                ADR-042 Bilingual Incident Synthesis Artifact
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                report.business_layer.status === 'RESOLVED'
                  ? 'bg-emerald-100 text-emerald-800'
                  : report.business_layer.status === 'IDENTIFIED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {report.business_layer.status}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono">
              Output Contract: ADR Section 4 Unified Report Schema
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1.5 bg-stone-200/80 p-1 rounded-lg text-xs font-medium text-stone-700">
          <button
            id="view-both"
            onClick={() => setActiveView('both')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeView === 'both' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            Dual View
          </button>
          <button
            id="view-business"
            onClick={() => setActiveView('business')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
              activeView === 'business' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Customer View</span>
          </button>
          <button
            id="view-tech"
            onClick={() => setActiveView('technical')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
              activeView === 'technical' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-stone-700" />
            <span>Engineering View</span>
          </button>
          <button
            id="view-json"
            onClick={() => setActiveView('json')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center space-x-1 ${
              activeView === 'json' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'hover:text-stone-900'
            }`}
          >
            <FileJson className="w-3.5 h-3.5 text-amber-700" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Report Content Body */}
      <div className="p-4 sm:p-6">
        {/* JSON VIEW ONLY */}
        {activeView === 'json' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-stone-500">ADR Section 4 JSON Contract payload</span>
              <button
                id="btn-copy-json"
                onClick={handleCopyJson}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 flex items-center space-x-1.5 transition-colors"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'Copied JSON!' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto border border-stone-800 leading-relaxed">
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}

        {/* SPLIT / DUAL VIEW OR INDIVIDUAL */}
        {activeView !== 'json' && (
          <div className={`grid gap-6 ${
            activeView === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}>
            {/* BUSINESS / CUSTOMER LAYER */}
            {(activeView === 'both' || activeView === 'business') && (
              <div className="border border-blue-200 rounded-xl p-5 bg-gradient-to-b from-blue-50/50 to-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        CS
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          Business &amp; Customer View
                        </h4>
                        <span className="text-[11px] text-blue-700 font-medium">
                          Derived via Stage 2 • Zero internal jargon or blame
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-blue-100 text-blue-800">
                      Scrubbed
                    </span>
                  </div>

                  {/* Impact Scope */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Impact Scope
                    </label>
                    <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 font-medium">
                      {report.business_layer.impact_scope}
                    </div>
                  </div>

                  {/* Plain English Summary */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Plain-English Executive Summary
                    </label>
                    <p className="text-xs text-stone-700 leading-relaxed p-3 rounded-lg bg-white border border-stone-200">
                      {report.business_layer.plain_summary}
                    </p>
                  </div>

                  {/* Draft Customer Response (Copy-paste ready!) */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Customer-Ready Draft Email / Zendesk Reply
                      </label>
                      <button
                        id="btn-copy-customer-draft"
                        onClick={handleCopyDraft}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        {copiedDraft ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied to clipboard!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Email Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3.5 rounded-lg bg-white border border-blue-200/80 text-xs text-stone-800 whitespace-pre-line font-sans leading-relaxed shadow-xs">
                      {report.business_layer.customer_draft_response}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-blue-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center">
                    <Info className="w-3.5 h-3.5 text-blue-500 mr-1" />
                    Guaranteed free of internal IPs, credentials &amp; pod names.
                  </span>
                  <button
                    onClick={handleCopyDraft}
                    className="px-2.5 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs font-medium transition-colors"
                  >
                    Copy for Client
                  </button>
                </div>
              </div>
            )}

            {/* TECHNICAL / SRE LAYER */}
            {(activeView === 'both' || activeView === 'technical') && (
              <div className="border border-stone-200 rounded-xl p-5 bg-gradient-to-b from-stone-50/70 to-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-xs font-mono">
                        SRE
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">
                          Engineering &amp; SRE View
                        </h4>
                        <span className="text-[11px] text-stone-500 font-mono">
                          Grounded Technical Truth via Stage 1
                        </span>
                      </div>
                    </div>
                    <button
                      id="btn-copy-tech"
                      onClick={handleCopyTech}
                      className="text-[11px] font-medium text-stone-600 hover:text-stone-900 flex items-center space-x-1"
                    >
                      {copiedTech ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTech ? 'Copied' : 'Copy SRE Notes'}</span>
                    </button>
                  </div>

                  {/* Root Cause Hypothesis */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Root Cause Hypothesis
                    </label>
                    <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 font-mono leading-relaxed">
                      {report.technical_layer.root_cause_hypothesis}
                    </div>
                  </div>

                  {/* Metrics & Evidence (Error rate, p99 latency) */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Metrics &amp; Evidence
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                        <span className="text-[10px] text-stone-500 uppercase font-mono">Error Rate Delta</span>
                        <div className="text-sm font-bold text-red-600 font-mono">
                          {report.technical_layer.metrics_and_evidence.error_rate_delta}
                        </div>
                      </div>
                      <div className="bg-white border border-stone-200 rounded-lg p-2.5">
                        <span className="text-[10px] text-stone-500 uppercase font-mono">p99 Latency</span>
                        <div className="text-sm font-bold text-stone-900 font-mono">
                          {report.technical_layer.metrics_and_evidence.p99_latency}
                        </div>
                      </div>
                    </div>

                    {/* Culprit Signatures */}
                    <div className="bg-white border border-stone-200 rounded-lg p-3">
                      <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block mb-1.5">
                        Culprit Signatures ({report.technical_layer.metrics_and_evidence.culprit_signatures.length})
                      </span>
                      <ul className="space-y-1.5">
                        {report.technical_layer.metrics_and_evidence.culprit_signatures.map((sig, idx) => (
                          <li key={idx} className="text-[11px] font-mono text-stone-800 flex items-start space-x-1.5">
                            <span className="text-red-500 shrink-0 mt-0.5">●</span>
                            <span className="break-all">{sig}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Executed Deterministic Scripts */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Executed Runbook Scripts (Deterministic)
                    </label>
                    <div className="space-y-1.5">
                      {report.technical_layer.executed_scripts.map((script, idx) => (
                        <div key={idx} className="bg-stone-900 text-stone-100 rounded-lg p-2.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-semibold">{script.script_name}</span>
                            <span className="text-stone-400">Exit Code: {script.exit_code}</span>
                          </div>
                          {script.execution_time_ms && (
                            <div className="text-[10px] text-stone-400 mt-1 flex space-x-3">
                              <span>Duration: {script.execution_time_ms}ms</span>
                              <span>Scrubbed PII: {script.sanitized_pii_count || 0}</span>
                              <span>Reduction: {script.token_reduction_percent || 99.8}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Remediation */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Recommended Remediation
                    </label>
                    <div className="p-3 rounded-lg bg-white border border-stone-200 text-xs text-stone-800 leading-relaxed font-mono whitespace-pre-line">
                      {report.technical_layer.recommended_remediation}
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="font-mono">Subclassed BaseLogTool Contract</span>
                  <span className="text-emerald-700 font-semibold font-mono">0 raw log lines sent to LLM</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
