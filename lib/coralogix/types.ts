// Coralogix API Types

export interface CoralogixAlert {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'error' | 'warning' | 'info';
  status: 'firing' | 'pending' | 'resolved';
  labels: Record<string, string>;
  annotations: {
    summary: string;
    description: string;
    runbook_url?: string;
  };
  startsAt: string;
  endsAt: string | null;
  fingerprint: string;
  query: string;
  metaLabels?: Record<string, string>;
}

export interface CoralogixAlertsResponse {
  alerts: CoralogixAlert[];
}

export interface CoralogixAlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'critical' | 'error' | 'warning' | 'info';
  condition: {
    query: string;
    threshold: {
      value: number;
      operator: 'greater_than' | 'less_than' | 'equals';
      timeWindow: string;
    };
  };
  notifications: {
    emails?: string[];
    webhooks?: string[];
    integrations?: string[];
  };
  schedule: {
    active: boolean;
    timezone: string;
  };
}

export interface CoralogixAlertRulesResponse {
  alertDefs: CoralogixAlertRule[];
}

export interface CoralogixAPMService {
  name: string;
  language: string;
  metrics: {
    requestRate: number;
    errorRate: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
  };
  status: 'healthy' | 'degraded' | 'down';
  lastSeen: string;
}

export interface CoralogixAPMResponse {
  services: CoralogixAPMService[];
}

export interface CoralogixSLO {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  errorBudget: {
    total: number;
    remaining: number;
    consumed: number;
    consumedPercentage: number;
  };
  status: 'healthy' | 'at_risk' | 'breached';
  timeWindow: string;
  labels: Record<string, string>;
}

export interface CoralogixSLOResponse {
  slos: CoralogixSLO[];
}

export interface CoralogixUsage {
  totalGB: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  byApplication: Record<string, number>;
}

export interface CoralogixQuota {
  current: number;
  limit: number;
  unit: string;
  period: string;
}

export interface CoralogixUsageResponse {
  usage: CoralogixUsage;
  quota?: CoralogixQuota;
}

// Legacy stats format (for aggregation queries)
export interface CoralogixLogStats {
  severity: string;
  service: string;
  count: number;
}

// Actual DataPrime API response format (NDJSON combined)
export interface CoralogixLogEntry {
  metadata: Array<{ key: string; value: string }>;
  labels?: Record<string, string>;
  userData?: string;
}

export interface CoralogixLogStatsResponse {
  // Query ID from first NDJSON line
  queryId?: { queryId: string };
  // Results from subsequent NDJSON lines
  result?: {
    results: CoralogixLogEntry[] | CoralogixLogStats[];
    metadata?: {
      executionTimeMs?: number;
      scannedBytes?: number;
    };
  };
  // Direct results array (alternative format)
  results?: CoralogixLogEntry[];
}

// API Request Types
export interface CoralogixAlertsRequest {
  filter: {
    status: string[];
  };
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface CoralogixLogQueryRequest {
  query: string;
  metadata?: {
    syntax?: 'QUERY_SYNTAX_DATAPRIME' | 'QUERY_SYNTAX_LUCENE';
    start_date?: string;
    end_date?: string;
    defaultSource?: string;
    // Legacy fields (may not be used)
    tier?: string;
  };
}

// Error Types
export interface CoralogixError {
  message: string;
  status: number;
  details?: unknown;
}

// Client Configuration
export interface CoralogixConfig {
  apiKey: string;
  region: 'us1' | 'us2' | 'eu1' | 'eu2' | 'ap1' | 'ap2';
  domain?: string;
}
