import React from 'react';
import { X, FileText, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { SAMPLE_RAW_LOG_LINES } from '../mockData';

interface TelemetryComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics?: any;
}

export const TelemetryComparisonModal: React.FC<TelemetryComparisonModalProps> = ({
  isOpen,
  onClose,
  metrics,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Telemetry Contrast: Raw Log Stream vs Deterministic Aggregation
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              ADR-042 Decoupling: Code executes deterministically in runner; only high-signal metrics reach LLM.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Comparison */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs">
              <span className="text-red-700 font-bold block mb-1">Traditional LLM Approach</span>
              <p className="text-stone-700 font-mono text-[11px]">
                Payload: ~3.8 MB raw text<br />
                Tokens: ~950,000 tokens<br />
                Cost: High / Context Limit Exceeded
              </p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
              <span className="text-emerald-800 font-bold block mb-1">ADR-042 Deterministic Script</span>
              <p className="text-stone-700 font-mono text-[11px]">
                Payload: 540 bytes JSON<br />
                Tokens: ~135 tokens<br />
                Token Reduction: &gt; 99.8%
              </p>
            </div>
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs">
              <span className="text-stone-800 font-bold block mb-1">Safety &amp; Compliance</span>
              <p className="text-stone-600 font-mono text-[11px]">
                PII Scrubbing: Active<br />
                Read-Only Token: Enforced<br />
                Hallucinations on math: 0%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Raw Logs Sample */}
            <div className="border border-red-200 rounded-xl overflow-hidden bg-stone-900 text-stone-200 flex flex-col">
              <div className="bg-red-950/80 px-4 py-2 border-b border-red-900/50 flex items-center justify-between text-xs font-mono text-red-300">
                <span>Raw Unstructured Log Dumps (DO NOT FEED TO LLM)</span>
                <span className="text-red-400 font-bold">Unsafe / Noisy</span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto space-y-2 text-stone-300">
                {SAMPLE_RAW_LOG_LINES.map((line, idx) => (
                  <div key={idx} className="border-b border-stone-800 pb-1 break-all">
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Structured Compressed Output */}
            <div className="border border-emerald-300 rounded-xl overflow-hidden bg-stone-900 text-stone-200 flex flex-col">
              <div className="bg-emerald-950/80 px-4 py-2 border-b border-emerald-900/50 flex items-center justify-between text-xs font-mono text-emerald-300">
                <span>Deterministic Compressed JSON (Fed to Synthesizer)</span>
                <span className="text-emerald-400 font-bold">High-Signal</span>
              </div>
              <pre className="p-3 font-mono text-[11px] leading-relaxed overflow-x-auto text-emerald-400">
{JSON.stringify({
  exit_code: 0,
  scanned_records: 14820,
  p99_latency: "28.4s",
  error_rate_delta: "+312% vs baseline",
  sanitized_pii: {
    emails_scrubbed: 4,
    bearer_tokens_scrubbed: 2,
    internal_ips_masked: 6
  },
  culprit_signatures: [
    "Chromium headless subprocess SIGKILL (OOM / memory budget 1024MB exceeded)",
    "Nginx proxy downstream timeout waiting for billing-exporter (30000ms threshold reached)"
  ]
}, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
