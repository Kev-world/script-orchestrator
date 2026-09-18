import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory state for MVP registry and PRs
let toolsRegistry = [
  {
    id: 'tool_pdf_export_timeout',
    name: 'Analyze PDF Export Timeouts & OOM Kills',
    filename: 'analyze_pdf_export_timeouts.py',
    description: 'Calculates p99 rendering latency, headless Chromium subprocess crashes, and HTTP 504 gateway timeout signatures for document export workers.',
    targetService: 'billing-exporter',
    isCertified: true,
    isQuarantined: false,
    author: 'Human SRE',
    createdAt: '2026-08-10T14:30:00Z',
    lastExecutedAt: '2026-09-17T18:22:10Z',
    executionCount: 142,
    keywords: ['pdf', 'export', '504', 'timeout', 'chromium', 'oom', 'render', 'document'],
    pythonCode: `from runbooks.base import BaseLogTool, CompressedLogMetrics
from typing import Dict

class AnalyzePdfExportTimeouts(BaseLogTool):
    """
    Subclasses BaseLogTool per ADR-042.
    Queries billing-exporter pods. Enforces 60-minute query window.
    Emits compressed aggregates; never emits raw log streams.
    """
    def execute(self, tenant_id: str, time_window: Dict[str, str]) -> CompressedLogMetrics:
        query = f"service:billing-exporter AND tenant_id:{tenant_id} AND status:>=500"
        records = self.log_client.query_aggregates(query, window=time_window)
        
        p99 = self.calculate_percentile(records, 'duration_ms', 99)
        error_rate_delta = self.compute_delta_against_baseline(tenant_id, records)
        
        signatures = [
            "Chromium headless subprocess SIGKILL (OOM / memory budget 1024MB exceeded)",
            "Nginx proxy downstream timeout waiting for billing-exporter (30000ms threshold reached)"
        ]
        
        return CompressedLogMetrics(
            exit_code=0,
            error_rate_delta="+312% vs 7-day rolling baseline",
            p99_latency=f"{p99:.1f}s",
            culprit_signatures=signatures,
            scanned_records=14820,
            aggregated_payload_bytes=840
        )
`
  },
  {
    id: 'tool_db_pool_starvation',
    name: 'Check DB Connection Pool & Advisory Locks',
    filename: 'check_db_connection_pool.py',
    description: 'Inspects active vs idle connections, transaction wait queues, and deadlocked PID signatures across Postgres RDS read/write clusters.',
    targetService: 'db-connection-pool',
    isCertified: true,
    isQuarantined: false,
    author: 'Human SRE',
    createdAt: '2026-07-22T09:15:00Z',
    lastExecutedAt: '2026-09-18T01:45:00Z',
    executionCount: 289,
    keywords: ['database', 'db', 'lock', 'postgres', 'pool', 'connection', 'starvation', 'deadlock', 'widget'],
    pythonCode: `from runbooks.base import BaseLogTool, CompressedLogMetrics
from typing import Dict

class CheckDbConnectionPool(BaseLogTool):
    """
    ADR-042 Deterministic query against Postgres telemetry & PgBouncer logs.
    """
    def execute(self, tenant_id: str, time_window: Dict[str, str]) -> CompressedLogMetrics:
        query = f"tag:pgbouncer AND tenant:{tenant_id}"
        metrics = self.log_client.aggregate_pool_stats(query, window=time_window)
        
        return CompressedLogMetrics(
            exit_code=0,
            error_rate_delta="+180% active connection wait spike",
            p99_latency="14.2s (connection acquisition)",
            culprit_signatures=[
                "FATAL: remaining connection slots are reserved for non-replication superuser connections",
                "Transaction block deadlock detected waiting for ShareLock on widget_settings_v3"
            ],
            scanned_records=31200,
            aggregated_payload_bytes=620
        )
`
  },
  {
    id: 'tool_auth_jwt_rate_limit',
    name: 'Audit Auth Gateway Rate Limits & Token Revocation',
    filename: 'audit_auth_rate_limits.py',
    description: 'Aggregates 401 Unauthorized and 429 Too Many Requests distributions by client IP and tenant token fingerprint.',
    targetService: 'auth-gateway',
    isCertified: true,
    isQuarantined: false,
    author: 'Human SRE',
    createdAt: '2026-08-01T11:00:00Z',
    lastExecutedAt: '2026-09-16T12:10:00Z',
    executionCount: 95,
    keywords: ['auth', 'login', 'jwt', '401', '429', 'rate limit', 'token', 'gateway', 'unauthorized'],
    pythonCode: `from runbooks.base import BaseLogTool, CompressedLogMetrics
from typing import Dict

class AuditAuthRateLimits(BaseLogTool):
    """
    Scans auth-gateway access telemetry with automatic PII sanitization.
    """
    def execute(self, tenant_id: str, time_window: Dict[str, str]) -> CompressedLogMetrics:
        results = self.log_client.query_status_distribution("service:auth-gateway", tenant_id, time_window)
        return CompressedLogMetrics(
            exit_code=0,
            error_rate_delta="+45% 429 rate limit throttles",
            p99_latency="420ms",
            culprit_signatures=[
                "IP 192.168.**.** exceeded burst token bucket (limit: 120 req/min)",
                "JWT signature verification failed: public key rollover grace expired"
            ],
            scanned_records=9400,
            aggregated_payload_bytes=512
        )
`
  }
];

let pullRequests: any[] = [
  {
    id: 'pr_102',
    prNumber: 102,
    title: 'feat(runbooks): add redis_cluster_eviction_probe.py',
    branch: 'ai-synthesis/redis-eviction-probe',
    author: 'Autonomous Tool Synthesizer (ADR-042)',
    status: 'MERGED',
    createdAt: '2026-09-14T09:12:00Z',
    toolId: 'tool_redis_eviction',
    sandboxTestResult: {
      passed: true,
      durationMs: 1240,
      timeoutSeconds: 10,
      exitCode: 0,
      metricsSample: {
        evicted_keys_rate: "4,200/sec",
        p99_latency: "22ms",
        sanitized_tokens: 18
      }
    },
    diffSummary: '+48 lines in runbooks/redis_cluster_eviction_probe.py'
  }
];

let prCounter = 103;

// Tenant Dictionary for Entity Context Resolution
const TENANT_DICT: Record<string, { tenantId: string; tier: string }> = {
  'acme': { tenantId: 'org_acme_981', tier: 'Enterprise Tier 1' },
  'acme corp': { tenantId: 'org_acme_981', tier: 'Enterprise Tier 1' },
  'globex': { tenantId: 'org_globex_441', tier: 'Business Premium' },
  'globex inc': { tenantId: 'org_globex_441', tier: 'Business Premium' },
  'stark': { tenantId: 'org_stark_007', tier: 'Mission Critical 24/7' },
  'stark industries': { tenantId: 'org_stark_007', tier: 'Mission Critical 24/7' },
  'initech': { tenantId: 'org_initech_102', tier: 'Standard' },
  'wayne enterprises': { tenantId: 'org_wayne_883', tier: 'Enterprise Tier 1' },
};

// Feature Dictionary
const FEATURE_DICT: Record<string, { service: string; route: string }> = {
  'pdf': { service: 'billing-exporter', route: '/v2/export/pdf' },
  'export': { service: 'billing-exporter', route: '/v2/export/pdf' },
  'document': { service: 'billing-exporter', route: '/v2/export/pdf' },
  'webhook': { service: 'billing-stripe-ingress', route: '/webhooks/stripe/v1' },
  'stripe': { service: 'billing-stripe-ingress', route: '/webhooks/stripe/v1' },
  'payment': { service: 'billing-stripe-ingress', route: '/webhooks/stripe/v1' },
  'database': { service: 'db-connection-pool', route: '/v1/internal/query-proxy' },
  'db': { service: 'db-connection-pool', route: '/v1/internal/query-proxy' },
  'lock': { service: 'db-connection-pool', route: '/v1/internal/query-proxy' },
  'widget': { service: 'analytics-dashboard-api', route: '/api/v3/widgets/render' },
  'dashboard': { service: 'analytics-dashboard-api', route: '/api/v3/widgets/render' },
  'login': { service: 'auth-gateway', route: '/oauth/token' },
  'jwt': { service: 'auth-gateway', route: '/oauth/token' },
  'auth': { service: 'auth-gateway', route: '/oauth/token' },
  'checkout': { service: 'checkout-service', route: '/v1/cart/checkout' },
};

// Lazy Gemini AI initialization
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Layer 1: Entity & Context Resolver
function resolveEntityContext(prompt: string) {
  const lower = prompt.toLowerCase();
  
  // Resolve Customer -> tenant_id
  let customerName = "Unknown Customer";
  let tenantId = "org_default_001";
  for (const [name, info] of Object.entries(TENANT_DICT)) {
    if (lower.includes(name)) {
      customerName = name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      tenantId = info.tenantId;
      break;
    }
  }

  // If still unknown, check if user specified a name like "Client X" or "Company Y"
  if (customerName === "Unknown Customer") {
    const match = prompt.match(/(?:customer|client|tenant|org)\s+([A-Za-z0-9_-]+)/i);
    if (match) {
      customerName = match[1];
      tenantId = `org_${customerName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    }
  }

  // Resolve Feature -> service & route
  let featureOrScreen = "General Service";
  let targetService = "api-gateway";
  let route = "/api/v1/general";
  for (const [key, val] of Object.entries(FEATURE_DICT)) {
    if (lower.includes(key)) {
      featureOrScreen = key.toUpperCase();
      targetService = val.service;
      route = val.route;
      break;
    }
  }

  // Resolve Relative Time -> ISO 8601 UTC
  let relativeTime = "last 30 minutes";
  const timeMatch = prompt.match(/last\s+(\d+)\s*(min|minute|hour|m|h)s?/i);
  let durationMinutes = 30;
  if (timeMatch) {
    relativeTime = timeMatch[0];
    const num = parseInt(timeMatch[1], 10);
    const unit = timeMatch[2].toLowerCase();
    durationMinutes = unit.startsWith('h') ? num * 60 : num;
    if (durationMinutes > 60) durationMinutes = 60; // Max query performance guardrail per ADR-042!
  }

  const now = new Date();
  const start = new Date(now.getTime() - durationMinutes * 60 * 1000);

  return {
    customerName,
    tenantId,
    featureOrScreen,
    targetService,
    route,
    relativeTime: `${durationMinutes}m window`,
    timeWindowIso: {
      start: start.toISOString(),
      end: now.toISOString(),
    },
  };
}

// Layer 2: Tool Router - checks relevance against registry
function routeTool(prompt: string, targetService: string) {
  const lower = prompt.toLowerCase();
  let bestTool: any = null;
  let highestScore = 0;

  for (const tool of toolsRegistry) {
    let matches = 0;
    for (const kw of tool.keywords) {
      if (lower.includes(kw)) matches++;
    }
    if (tool.targetService === targetService) {
      matches += 2;
    }

    const score = Math.min(0.98, matches > 0 ? 0.45 + matches * 0.15 : 0.15);
    if (score > highestScore) {
      highestScore = score;
      bestTool = tool;
    }
  }

  return {
    bestTool,
    relevanceScore: Math.round(highestScore * 100) / 100,
  };
}

// Autonomous Tool Synthesis (Path B: when relevance < 0.75)
async function synthesizeRunbookTool(entityContext: any, prompt: string) {
  const cleanServiceName = entityContext.targetService.replace(/[^a-zA-Z0-9]/g, '_');
  const toolName = `Probe ${entityContext.targetService.toUpperCase()} Telemetry`;
  const filename = `${cleanServiceName}_telemetry_probe.py`;
  const toolId = `tool_synth_${Date.now()}`;

  const generatedCode = `from runbooks.base import BaseLogTool, CompressedLogMetrics
from typing import Dict, Any

class ${cleanServiceName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Probe(BaseLogTool):
    """
    Autonomously synthesized runbook for ${entityContext.targetService}.
    Generated per ADR-042 autonomously when matching score < 0.75.
    Target Route: ${entityContext.route}
    """
    def execute(self, tenant_id: str, time_window: Dict[str, str]) -> CompressedLogMetrics:
        query = f"service:${entityContext.targetService} AND tenant_id:{tenant_id} AND (status:>=400 OR level:ERROR)"
        aggregates = self.log_client.query_aggregates(query, window=time_window)
        
        # Calculate metric summaries
        p99 = self.calculate_percentile(aggregates, 'latency_ms', 99)
        error_rate = self.calculate_error_rate(aggregates)
        
        return CompressedLogMetrics(
            exit_code=0,
            error_rate_delta=f"+{error_rate:.1f}% failure rate spike",
            p99_latency=f"{p99 / 1000.0:.2f}s",
            culprit_signatures=[
                f"${entityContext.targetService}: connection dropped by peer while handling ${entityContext.route}",
                "Worker queue saturated: backpressure throttling applied"
            ],
            scanned_records=8920,
            aggregated_payload_bytes=480
        )
`;

  // Sandbox Test Execution (simulated gVisor/Docker runner with 10s timeout)
  const sandboxDuration = Math.floor(800 + Math.random() * 600);
  const sandboxTestResult = {
    passed: true,
    durationMs: sandboxDuration,
    timeoutSeconds: 10,
    exitCode: 0,
    metricsSample: {
      test_tenant: entityContext.tenantId,
      records_scanned: 8920,
      exit_code: 0,
      payload_bytes: 480,
    },
  };

  const newTool = {
    id: toolId,
    name: toolName,
    filename,
    description: `Autonomously synthesized runbook for ${entityContext.targetService} investigating: "${prompt.slice(0, 80)}..."`,
    targetService: entityContext.targetService,
    isCertified: false,
    isQuarantined: true, // Registered locally as quarantined tool per ADR-042!
    author: 'Autonomous AI (Self-Evolved)',
    createdAt: new Date().toISOString(),
    lastExecutedAt: new Date().toISOString(),
    executionCount: 1,
    keywords: prompt.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3),
    pythonCode: generatedCode,
  };

  toolsRegistry.unshift(newTool);

  // Automated Pull Request opened against runbooks/ repository per ADR-042!
  const pr = {
    id: `pr_${prCounter}`,
    prNumber: prCounter++,
    title: `feat(runbooks): Add ${filename} for ${entityContext.targetService}`,
    branch: `ai-synthesis/${cleanServiceName}-${Date.now().toString().slice(-4)}`,
    author: 'Autonomous Tool Synthesizer (ADR-042)',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    toolId: toolId,
    sandboxTestResult,
    diffSummary: `+38 lines in runbooks/${filename}`,
  };

  pullRequests.unshift(pr);

  return { newTool, pr, sandboxTestResult };
}

// Layer 3: Deterministic Execution Engine
function executeDeterministicScript(tool: any, entityContext: any) {
  // Scans log store with read-only token, enforces regex scrubber for PII
  const rawBytes = Math.floor(2500000 + Math.random() * 1500000); // ~2.5MB - 4.0MB of raw log text
  const outputBytes = Math.floor(450 + Math.random() * 350); // ~500-800 bytes of structured JSON!
  const tokenReduction = ((rawBytes - outputBytes) / rawBytes) * 100;

  const executionMetrics = {
    script_name: tool.filename,
    parameters: {
      tenant_id: entityContext.tenantId,
      time_window: entityContext.timeWindowIso,
      max_query_minutes: 60,
      read_only_token: "st_ro_telemetry_scoped_***"
    },
    exit_code: 0,
    execution_time_ms: Math.floor(180 + Math.random() * 120),
    sanitized_pii_count: 14,
    raw_bytes_scanned: rawBytes,
    output_bytes: outputBytes,
    token_reduction_percent: Math.round(tokenReduction * 10) / 10,
  };

  // Extract realistic metrics based on target service
  let errorRateDelta = "+240% vs rolling baseline";
  let p99Latency = "28.4s";
  let culpritSignatures = [
    "Chromium headless subprocess SIGKILL (OOM / memory budget 1024MB exceeded)",
    "Nginx proxy downstream timeout waiting for billing-exporter (30000ms threshold reached)"
  ];
  let rootCause = `Headless document worker ran out of memory (1024MB limit) processing complex CSS tables in ${entityContext.featureOrScreen} for ${entityContext.tenantId}, leading to unhandled SIGKILL and 504 Gateway Timeouts.`;
  let remediation = `1. Temporarily increase billing-exporter container memory limits to 2048Mi in Helm values. 2. Restart stalled worker pods in namespace 'production-billing'. 3. Direct customer to re-trigger export once pod restart completes.`;

  if (entityContext.targetService.includes('stripe') || entityContext.targetService.includes('webhook')) {
    errorRateDelta = "+100% dropped webhooks";
    p99Latency = "15.8s (timeout)";
    culpritSignatures = [
      "Stripe signature verification TLS handshake reset by ingress edge",
      "Webhook worker pod connection pool starvation (0 of 50 idle connections available)"
    ];
    rootCause = `Ingress TLS handshake drops and worker connection pool starvation caused ${entityContext.targetService} to fail acknowledging incoming payment notifications.`;
    remediation = `1. Scale webhook worker replicas from 2 to 6. 2. Verify Stripe secret signing keys rollover. 3. Replay unacknowledged webhook events from Stripe dashboard.`;
  } else if (entityContext.targetService.includes('db') || entityContext.targetService.includes('pool')) {
    errorRateDelta = "+180% active connection wait spike";
    p99Latency = "14.2s (connection acquisition)";
    culpritSignatures = [
      "FATAL: remaining connection slots are reserved for non-replication superuser connections",
      "Transaction block deadlock detected waiting for ShareLock on widget_settings_v3"
    ];
    rootCause = `Long-running unindexed transaction on widget settings held an exclusive lock, starving the connection pool for ${entityContext.tenantId}.`;
    remediation = `1. Terminate blocking PID on primary Postgres instance. 2. Deploy hotfix migration adding index on tenant_id + widget_id.`;
  } else if (entityContext.targetService.includes('auth')) {
    errorRateDelta = "+65% 401 & 429 spike";
    p99Latency = "850ms";
    culpritSignatures = [
      "JWT public key JWKS cache miss expired without fallback",
      "Rate limiter bucket exhausted for corporate VPN egress gateway"
    ];
    rootCause = `Stale JWKS key set in auth-gateway caused legitimate user tokens to fail validation intermittently.`;
    remediation = `1. Flush Redis JWKS cache on auth-gateway. 2. Verify IdP certificate auto-refresh cron.`;
  }

  return {
    executionMetrics,
    rawTelemetrySummary: {
      errorRateDelta,
      p99Latency,
      culpritSignatures,
      rootCause,
      remediation
    }
  };
}

// Layer 4: Bilingual AI Synthesizer (Stage 1 Technical Truth -> Stage 2 Customer-Facing Translation)
async function synthesizeBilingualReport(
  prompt: string,
  entityContext: any,
  scriptMetrics: any,
  rawSummary: any,
  tool: any
) {
  const gemini = getGeminiClient();

  // Try real Gemini AI first if configured
  if (gemini) {
    try {
      const systemInstruction = `You are the ADR-042 Bilingual AI Synthesizer.
Follow the strict two-stage reasoning pipeline:
Stage 1: Ground Technical Truth based strictly on the JSON payload returned by deterministic scripts.
Stage 2: Derive Customer View, scrubbing ALL internal infrastructure names, IP addresses, credentials, server pod hashes, and blame-oriented language.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "business_layer": {
    "status": "RESOLVED | INVESTIGATING | IDENTIFIED",
    "impact_scope": "string (e.g. 'Tenant org_123 only; export functionality affected')",
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
}`;

      const aiPrompt = `Incident Prompt: "${prompt}"
Entity Context: Customer=${entityContext.customerName} (${entityContext.tenantId}), Feature=${entityContext.featureOrScreen}, Service=${entityContext.targetService}, Window=${entityContext.relativeTime}
Deterministic Script Executed: ${tool.filename} (Exit Code: 0)
Deterministic Aggregated Metrics:
- Error Rate Delta: ${rawSummary.errorRateDelta}
- p99 Latency: ${rawSummary.p99Latency}
- Signatures: ${JSON.stringify(rawSummary.culpritSignatures)}
- Technical Root Cause Hint: ${rawSummary.rootCause}
- Remediation Hint: ${rawSummary.remediation}

Perform Stage 1 and Stage 2 bilingual synthesis and return the JSON report.`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.8-flash",
        contents: aiPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.business_layer && parsed.technical_layer) {
          // Ensure executed_scripts is populated accurately
          parsed.technical_layer.executed_scripts = [scriptMetrics];
          return parsed;
        }
      }
    } catch (err) {
      console.warn("Gemini API call skipped or errored, falling back to deterministic template synthesis:", err);
    }
  }

  // High-fidelity deterministic fallback adhering strictly to ADR Section 4
  const plainSummary = `Our monitoring identified an isolated processing delay affecting ${entityContext.featureOrScreen.toLowerCase()} for ${entityContext.customerName}. Requests timed out due to high resource demand on document processing tasks. Core account data remains intact and unaffected.`;
  
  const customerDraft = `Hi ${entityContext.customerName} Team,

Thank you for reaching out, and we apologize for the inconvenience. 

Our engineering team has identified the cause of the delay affecting ${entityContext.featureOrScreen.toLowerCase()}. An isolated processing bottleneck caused export requests to time out over the past 30 minutes. We have allocated additional processing capacity and verified that operations are returning to normal.

Please retry your export at your convenience. If you experience any further issues, please reply directly to this message and our dedicated support team will assist immediately.

Best regards,
Customer Success & Support Operations`;

  return {
    business_layer: {
      status: "IDENTIFIED",
      impact_scope: `Tenant ${entityContext.tenantId} only; ${entityContext.featureOrScreen} functionality affected`,
      plain_summary: plainSummary,
      customer_draft_response: customerDraft,
    },
    technical_layer: {
      root_cause_hypothesis: rawSummary.rootCause,
      metrics_and_evidence: {
        error_rate_delta: rawSummary.errorRateDelta,
        p99_latency: rawSummary.p99Latency,
        culprit_signatures: rawSummary.culpritSignatures,
      },
      executed_scripts: [scriptMetrics],
      recommended_remediation: rawSummary.remediation,
    },
  };
}

// ================= API ROUTES =================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET /api/tools - list runbook scripts
app.get("/api/tools", (req, res) => {
  res.json({ tools: toolsRegistry });
});

// POST /api/tools/:id/certify - SRE merges/certifies a quarantined script
app.post("/api/tools/:id/certify", (req, res) => {
  const tool = toolsRegistry.find(t => t.id === req.params.id);
  if (!tool) return res.status(404).json({ error: "Tool not found" });
  tool.isCertified = true;
  tool.isQuarantined = false;
  res.json({ success: true, tool });
});

// GET /api/prs - list pull requests
app.get("/api/prs", (req, res) => {
  res.json({ prs: pullRequests });
});

// POST /api/prs/:id/merge - merge PR
app.post("/api/prs/:id/merge", (req, res) => {
  const pr = pullRequests.find(p => p.id === req.params.id);
  if (!pr) return res.status(404).json({ error: "PR not found" });
  pr.status = 'MERGED';
  // Also certify the tool
  const tool = toolsRegistry.find(t => t.id === pr.toolId);
  if (tool) {
    tool.isCertified = true;
    tool.isQuarantined = false;
  }
  res.json({ success: true, pr, tool });
});

// POST /api/investigate - End-to-end ADR-042 execution
app.post("/api/investigate", async (req, res) => {
  try {
    const { prompt, persona = 'customer_success' } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "Missing incident prompt" });
    }

    // Step 1: Entity & Context Resolver
    const entityContext = resolveEntityContext(prompt);

    // Step 2: Tool Registry & Router
    const { bestTool, relevanceScore } = routeTool(prompt, entityContext.targetService);
    
    let matchedTool = bestTool;
    let routingPath: 'Path A (Existing Runbook)' | 'Path B (Autonomous Synthesis)' = 'Path A (Existing Runbook)';
    let openedPr = null;
    let isSynthesizing = false;

    // ADR-042: If relevance score < 0.75, enter Tool Builder Mode!
    if (relevanceScore < 0.75 || !bestTool) {
      routingPath = 'Path B (Autonomous Synthesis)';
      isSynthesizing = true;
      const synthResult = await synthesizeRunbookTool(entityContext, prompt);
      matchedTool = synthResult.newTool;
      openedPr = synthResult.pr;
    } else {
      matchedTool.executionCount = (matchedTool.executionCount || 0) + 1;
      matchedTool.lastExecutedAt = new Date().toISOString();
    }

    // Step 3: Deterministic Execution Engine
    const { executionMetrics, rawTelemetrySummary } = executeDeterministicScript(matchedTool, entityContext);

    // Step 4: Bilingual AI Synthesizer
    const unifiedReport = await synthesizeBilingualReport(
      prompt,
      entityContext,
      executionMetrics,
      rawTelemetrySummary,
      matchedTool
    );

    res.json({
      entityContext,
      routingPath,
      relevanceScore,
      isSynthesizingTool: isSynthesizing,
      matchedTool,
      openedPr,
      executionMetrics,
      report: unifiedReport,
      executedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("Investigation error:", err);
    res.status(500).json({ error: err.message || "Failed to process incident" });
  }
});

// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
