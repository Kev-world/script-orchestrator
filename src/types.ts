export type Persona = 'customer_success' | 'sre_engineer';

export type IncidentStatus = 'RESOLVED' | 'INVESTIGATING' | 'IDENTIFIED';

export interface EntityContext {
  customerName: string;
  tenantId: string;
  featureOrScreen: string;
  targetService: string;
  route: string;
  relativeTime: string;
  timeWindowIso: {
    start: string;
    end: string;
  };
}

export interface RunbookTool {
  id: string;
  name: string;
  filename: string;
  description: string;
  targetService: string;
  isCertified: boolean;
  isQuarantined?: boolean;
  relevanceScore?: number;
  author: 'Human SRE' | 'Autonomous AI (Self-Evolved)';
  createdAt: string;
  lastExecutedAt?: string;
  executionCount: number;
  pythonCode: string;
}

export interface PullRequest {
  id: string;
  prNumber: number;
  title: string;
  branch: string;
  author: string;
  status: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  toolId: string;
  sandboxTestResult: {
    passed: boolean;
    durationMs: number;
    timeoutSeconds: number;
    exitCode: number;
    metricsSample: Record<string, any>;
  };
  diffSummary: string;
}

export interface ExecutedScriptResult {
  script_name: string;
  parameters: Record<string, any>;
  exit_code: number;
  execution_time_ms: number;
  sanitized_pii_count: number;
  raw_bytes_scanned: number;
  output_bytes: number;
  token_reduction_percent: number;
}

export interface BusinessLayer {
  status: IncidentStatus;
  impact_scope: string;
  plain_summary: string;
  customer_draft_response: string;
}

export interface TechnicalLayer {
  root_cause_hypothesis: string;
  metrics_and_evidence: {
    error_rate_delta: string;
    p99_latency: string;
    culprit_signatures: string[];
  };
  executed_scripts: ExecutedScriptResult[];
  recommended_remediation: string;
}

export interface UnifiedReport {
  business_layer: BusinessLayer;
  technical_layer: TechnicalLayer;
}

export interface PipelineExecutionState {
  step: 'idle' | 'layer1_entity' | 'layer2_routing' | 'layer2_synthesis' | 'layer3_deterministic' | 'layer4_bilingual' | 'completed';
  isSynthesizingTool: boolean;
  synthesizedToolName?: string;
  matchedTool?: RunbookTool;
  entityContext?: EntityContext;
  routingPath?: 'Path A (Existing Runbook)' | 'Path B (Autonomous Synthesis)';
  relevanceScore?: number;
  executionMetrics?: ExecutedScriptResult;
  report?: UnifiedReport;
  openedPr?: PullRequest;
  error?: string;
}
