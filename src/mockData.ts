import { RunbookTool, PullRequest } from './types';

export const INITIAL_TENANT_MAP: Record<string, { tenantId: string; tier: string; contacts: string[] }> = {
  'acme corp': { tenantId: 'org_acme_981', tier: 'Enterprise Tier 1', contacts: ['sarah.j@acme.com'] },
  'acme': { tenantId: 'org_acme_981', tier: 'Enterprise Tier 1', contacts: ['sarah.j@acme.com'] },
  'globex inc': { tenantId: 'org_globex_441', tier: 'Business Premium', contacts: ['support@globex.io'] },
  'globex': { tenantId: 'org_globex_441', tier: 'Business Premium', contacts: ['support@globex.io'] },
  'stark industries': { tenantId: 'org_stark_007', tier: 'Mission Critical 24/7', contacts: ['friday@stark.com'] },
  'stark': { tenantId: 'org_stark_007', tier: 'Mission Critical 24/7', contacts: ['friday@stark.com'] },
  'initech': { tenantId: 'org_initech_102', tier: 'Standard', contacts: ['peter@initech.corp'] },
  'wayne enterprises': { tenantId: 'org_wayne_883', tier: 'Enterprise Tier 1', contacts: ['lucius@wayne.com'] },
};

export const INITIAL_SERVICE_MAP: Record<string, { service: string; route: string; repo: string }> = {
  'export to pdf': { service: 'billing-exporter', route: '/v2/export/pdf', repo: 'services/exporter' },
  'pdf export': { service: 'billing-exporter', route: '/v2/export/pdf', repo: 'services/exporter' },
  'pdf': { service: 'billing-exporter', route: '/v2/export/pdf', repo: 'services/exporter' },
  'database lock': { service: 'db-connection-pool', route: '/v1/internal/query-proxy', repo: 'infra/postgres-proxy' },
  'dashboard': { service: 'analytics-dashboard-api', route: '/api/v3/widgets/render', repo: 'services/dashboard' },
  'login': { service: 'auth-gateway', route: '/oauth/token', repo: 'services/identity' },
  'jwt': { service: 'auth-gateway', route: '/oauth/token', repo: 'services/identity' },
  'stripe': { service: 'billing-stripe-ingress', route: '/webhooks/stripe/v1', repo: 'services/billing-webhooks' },
  'webhook': { service: 'billing-stripe-ingress', route: '/webhooks/stripe/v1', repo: 'services/billing-webhooks' },
  'checkout': { service: 'checkout-service', route: '/v1/cart/checkout', repo: 'services/checkout' },
};

export const INITIAL_RUNBOOKS: RunbookTool[] = [
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
    pythonCode: `from runbooks.base import BaseLogTool, CompressedLogMetrics
import re
from typing import Dict, Any

class AnalyzePdfExportTimeouts(BaseLogTool):
    """
    Subclasses BaseLogTool per ADR-042.
    Queries billing-exporter pods. Enforces 60-minute query window.
    Emits compressed aggregates; never emits raw log streams.
    """
    def execute(self, tenant_id: str, time_window: Dict[str, str]) -> CompressedLogMetrics:
        query = f"service:billing-exporter AND tenant_id:{tenant_id} AND status:>=500"
        records = self.log_client.query_aggregates(query, window=time_window)
        
        # Calculate p99 latency & top error signatures
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

export const INITIAL_PRS: PullRequest[] = [
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

export const SAMPLE_RAW_LOG_LINES = [
  `2026-09-18T04:12:01.482Z [billing-exporter-7f884-k29x] ERROR: WorkerPID 482 failed rendering document for tenant="org_acme_981" user="sarah.j@acme.com" auth_token="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." IP="192.168.1.14" -> Exit signal SIGKILL: Out of Memory (allocated 1048576KB)`,
  `2026-09-18T04:12:02.109Z [billing-exporter-7f884-k29x] WARN: Nginx upstream response buffering timeout after 30000ms. Client returned HTTP 504 Gateway Timeout.`,
  `2026-09-18T04:12:03.771Z [billing-exporter-7f884-v91a] ERROR: Chromium puppeteer render crashed at Page.pdf() with error: Target closed before screenshot completion.`,
  `2026-09-18T04:12:05.210Z [ingress-controller] INFO: 504 Gateway Timeout returned for route /v2/export/pdf?report_id=rep_88192 customer="org_acme_981" duration=30042ms`,
  `2026-09-18T04:12:07.994Z [billing-exporter-7f884-m41z] ERROR: Memory cgroup limit reached on node gke-pool-highmem-4 node_ip="10.240.12.8" killed process chrome-headless-bin`
];
