// Rootly API Types

// Raw API response types
export interface RootlyIncident {
  id: string;
  type: 'incidents';
  attributes: {
    sequential_id: number;
    title: string;
    slug: string;
    kind: 'normal' | 'scheduled' | 'backfilled';
    private: boolean;
    summary: string | null;
    status: 'in_triage' | 'started' | 'mitigated' | 'resolved' | 'cancelled';
    source: string;
    url: string;
    short_url: string | null;
    created_at: string;
    started_at: string | null;
    detected_at: string | null;
    acknowledged_at: string | null;
    mitigated_at: string | null;
    resolved_at: string | null;
    cancelled_at: string | null;
    severity?: {
      id: string;
      name: string;
      slug: string;
      color: string;
      severity: string;
    };
    environments?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    services?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    functionalities?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    groups?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
    created_by?: {
      id: string;
      name: string;
      email: string;
      slack_user_id?: string;
    };
  };
}

export interface RootlyAlert {
  id: string;
  type: 'alerts';
  attributes: {
    short_id: string;
    source: string;
    status: 'open' | 'acknowledged' | 'resolved' | 'noise';
    summary: string;
    description: string | null;
    started_at: string | null;
    ended_at: string | null;
    external_url: string | null;
    created_at: string;
    updated_at: string;
    alert_urgency?: {
      id: string;
      name: string;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      color: string;
    };
    services?: Array<{
      id: string;
      name: string;
      slug: string;
    }>;
  };
}

export interface RootlySeverity {
  id: string;
  type: 'severities';
  attributes: {
    name: string;
    slug: string;
    color: string;
    severity: string;
    position: number;
  };
}

export interface RootlyService {
  id: string;
  type: 'services';
  attributes: {
    name: string;
    slug: string;
    description: string | null;
    color: string;
    incidents_count: number;
  };
}

export interface RootlyComment {
  id: string;
  type: 'incident_events';
  attributes: {
    event_type: string;
    event_data: {
      body?: string;
      message?: string;
      [key: string]: any;
    };
    created_at: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

// Transformed types for TheBridge
export interface ActiveIncident {
  id: string;
  sequentialId: number;
  title: string;
  status: 'in_triage' | 'started' | 'mitigated' | 'resolved' | 'cancelled';
  severity: string;
  severityColor: string;
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  source: string;
  url: string;
  duration: string;
  startedAt: Date;
  services: string[];
  environments: string[];
  summary: string | null;
  createdBy?: {
    name: string;
    email: string;
    slackUserId?: string;
  };
}

export interface ActiveAlert {
  id: string;
  shortId: string;
  source: string;
  status: 'open' | 'acknowledged' | 'resolved' | 'noise';
  summary: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  urgencyColor: string;
  externalUrl: string | null;
  duration: string;
  startedAt: Date;
  services: string[];
}

export interface RootlyDashboardData {
  activeIncidents: ActiveIncident[];
  recentIncidents: ActiveIncident[];
  activeAlerts: ActiveAlert[];
  summary: {
    activeIncidentCount: number;
    activeAlertCount: number;
    activeAlertCountAtLimit: boolean;
    resolvedLast24h: number;
    mttrMinutes: number | null;
    byStatus: {
      inTriage: number;
      started: number;
      mitigated: number;
    };
    bySeverity: {
      sev1: number;
      sev2: number;
      sev3: number;
      sev4: number;
    };
  };
  timeBasedMetrics: {
    today: {
      created: number;
      resolved: number;
    };
    thisMonth: {
      created: number;
      resolved: number;
    };
    avgResponseTimeMinutes: number | null;
    monthlyBreakdown: {
      currentMonth: {
        name: string; // e.g., "December"
        incidents: number;
      };
      previousMonth: {
        name: string; // e.g., "November"
        incidents: number;
      };
      twoMonthsAgo: {
        name: string; // e.g., "October"
        incidents: number;
      };
    };
  };
  configuration: {
    alertSources: number;
    escalationPolicies: number;
    workflows: number;
    services: number;
    teams: number;
  };
}

// Create Incident Types
export interface CreateIncidentRequest {
  title: string;
  severity_id?: string;
  summary?: string;
  service_ids?: string[];
  environment_ids?: string[];
}

export interface CreateIncidentResponse {
  data: RootlyIncident;
}

// API Response wrappers
export interface RootlyListResponse<T> {
  data: T[];
  links?: {
    self: string;
    first: string;
    prev: string | null;
    next: string | null;
    last: string;
  };
  meta?: {
    total_count: number;
    total_pages: number;
  };
}
