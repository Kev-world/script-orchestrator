import React from 'react';
import { BookOpen, CheckCircle, ShieldAlert, Cpu, Layers, FileText } from 'lucide-react';

export const AdrSpecView: React.FC = () => {
  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Document Header */}
      <div className="bg-stone-50 border-b border-stone-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
              System Architecture Decision Record
            </span>
            <h1 className="text-lg font-bold text-stone-900 mt-0.5">
              ADR-042: Self-Evolving, Runbook-Driven Log Investigation &amp; Bilingual Synthesis
            </h1>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
              Status: Proposed / Accepted
            </span>
            <span className="text-stone-500">Date: 2026-09-18</span>
          </div>
        </div>
      </div>

      {/* Main Spec Text */}
      <div className="p-4 sm:p-8 space-y-8 max-w-4xl">
        {/* Deciders & Context */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-2">
            1. Context &amp; Problem Statement
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed mb-3">
            Directly feeding raw logs into Large Language Models (LLMs) for incident triage introduces several critical failure modes:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70">
              <span className="font-bold text-stone-900 block mb-1">1. Latency &amp; Tokens</span>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Ingesting megabytes of unstructured log dumps exceeds context limits and skyrockets token cost.
              </p>
            </div>
            <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70">
              <span className="font-bold text-stone-900 block mb-1">2. Hallucination Risk</span>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                LLMs struggle with precise aggregations (p99 calculations, exact error counts) on raw text streams.
              </p>
            </div>
            <div className="border border-stone-200 rounded-lg p-3 bg-stone-50/70">
              <span className="font-bold text-stone-900 block mb-1">3. Operational Bottlenecks</span>
              <p className="text-stone-600 text-[11px] leading-relaxed">
                Customer-facing teams (Sales, CS) lack telemetry access, paging on-call engineers for routine customer status inquiries.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Decision */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-2">
            2. The Decision
          </h3>
          <p className="text-xs text-stone-700 leading-relaxed mb-3">
            Decouple <span className="font-semibold text-stone-900">data retrieval/aggregation</span> from <span className="font-semibold text-stone-900">reasoning/communication</span> by introducing a three-tier architecture:
          </p>
          <ul className="space-y-2 text-xs text-stone-700">
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
              <span><strong className="text-stone-900">Deterministic Runbook Execution:</strong> Triage queries are executed via deterministic, read-only scripts that return structured, high-signal JSON metrics.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
              <span><strong className="text-stone-900">Autonomous Tool Synthesis:</strong> When no matching script exists for an incident profile (relevance &lt; 0.75), the AI autonomously authors, sandbox-tests, and registers a new deterministic tool against a fixed SDK.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
              <span><strong className="text-stone-900">Bilingual Synthesis:</strong> The agent produces a single dual-layer artifact containing both an Executive/Customer View and an Engineering/SRE View.</span>
            </li>
          </ul>
        </div>

        {/* Architecture Diagram */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-2">
            3. Architecture Blueprint
          </h3>
          <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-stone-800">
{`[ Non-Tech / Tech Prompt ] 
           │
           ▼
[ Layer 1: Entity & Context Resolver ]  <── Maps (Customer Name -> tenant_id, Feature -> service)
           │
           ▼
[ Layer 2: Tool Registry & Router ]
    ├── Path A (Tool Exists): Match deterministic script from registry
    └── Path B (Tool Missing): Synthesize script -> Sandbox Test -> Quarantine/PR -> Register
           │
           ▼
[ Layer 3: Deterministic Execution Engine ] <── Read-only execution against log storage
           │
           ▼ (Structured JSON / Error Fingerprints / Metrics)
[ Layer 4: Bilingual AI Synthesizer ]
    ├── Stage 1: Ground Technical Truth (Root cause, metrics, stack trace)
    └── Stage 2: Derive Customer View (Impact, plain-English summary, email draft)
           │
           ▼
[ Delivery: Slack / Zendesk / Internal Dashboard ]`}
          </pre>
        </div>

        {/* Section 4: Output Contract Schema */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-2">
            4. Output Contract (Unified Report Schema)
          </h3>
          <pre className="p-4 rounded-xl bg-stone-900 text-stone-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-stone-800">
{`{
  "business_layer": {
    "status": "RESOLVED | INVESTIGATING | IDENTIFIED",
    "impact_scope": "string (e.g., 'Tenant org_123 only; export functionality affected')",
    "plain_summary": "string (High-level narrative without technical jargon)",
    "customer_draft_response": "string (Polite, copy-paste ready message for the client)"
  },
  "technical_layer": {
    "root_cause_hypothesis": "string",
    "metrics_and_evidence": {
      "error_rate_delta": "string",
      "p99_latency": "string",
      "culprit_signatures": ["string"]
    },
    "executed_scripts": [
      {"script_name": "string", "parameters": {}, "exit_code": 0}
    ],
    "recommended_remediation": "string"
  }
}`}
          </pre>
        </div>

        {/* Section 5: Security Guardrails */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider font-mono mb-2">
            5. Security &amp; Safety Guardrails
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
              <span className="font-bold text-stone-900 block mb-1">Read-Only Scoped Tokens</span>
              <p className="text-stone-600 text-[11px]">All scripts interact with log stores using scoped read-only service credentials. Direct shell commands prohibited.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
              <span className="font-bold text-stone-900 block mb-1">60-Minute Max Query Window</span>
              <p className="text-stone-600 text-[11px]">Enforces automated limits on query duration to prevent cluster CPU &amp; I/O exhaustion.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
              <span className="font-bold text-stone-900 block mb-1">Role-Based Persona Gates</span>
              <p className="text-stone-600 text-[11px]">Non-technical users only run certified scripts. SREs review sandbox tests and merge PRs.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-stone-50">
              <span className="font-bold text-stone-900 block mb-1">Automated Regex PII Scrubber</span>
              <p className="text-stone-600 text-[11px]">Sanitizes bearer tokens, authorization headers, customer emails, and private IP addresses prior to LLM ingestion.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
