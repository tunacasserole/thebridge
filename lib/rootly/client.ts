// Rootly API Client

import {
  RootlyIncident,
  RootlyAlert,
  RootlyListResponse,
  RootlyDashboardData,
  ActiveIncident,
  ActiveAlert,
  RootlyComment,
} from './types';

const ROOTLY_API_URL = 'https://api.rootly.com/v1';

// Make API request to Rootly
async function rootlyFetch<T>(
  endpoint: string,
  apiKey: string,
  params?: Record<string, string>,
  method: string = 'GET',
  body?: any
): Promise<T> {
  const url = new URL(`${ROOTLY_API_URL}${endpoint}`);

  if (params && method === 'GET') {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/vnd.api+json',
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Rootly API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Map severity to priority
function mapSeverityToPriority(severity?: string): 'P1' | 'P2' | 'P3' | 'P4' {
  if (!severity) return 'P4';
  const sev = severity.toLowerCase();
  if (sev.includes('sev1') || sev.includes('critical') || sev === '1') return 'P1';
  if (sev.includes('sev2') || sev.includes('high') || sev === '2') return 'P2';
  if (sev.includes('sev3') || sev.includes('medium') || sev === '3') return 'P3';
  return 'P4';
}

// Format duration from timestamp to human-readable
function formatDuration(startTime: string | null): string {
  if (!startTime) return 'Unknown';

  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diffMs = now - start;

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  }
  return 'Just now';
}

// Transform Rootly incident to TheBridge format
function transformIncident(incident: RootlyIncident): ActiveIncident {
  const attrs = incident.attributes;
  const severityName = attrs.severity?.name || attrs.severity?.slug || 'Unknown';

  return {
    id: incident.id,
    sequentialId: attrs.sequential_id,
    title: attrs.title,
    status: attrs.status,
    severity: severityName,
    severityColor: attrs.severity?.color || '#888888',
    priority: mapSeverityToPriority(attrs.severity?.severity || severityName),
    source: attrs.source,
    url: attrs.url || attrs.short_url || '',
    duration: formatDuration(attrs.started_at || attrs.created_at),
    startedAt: new Date(attrs.started_at || attrs.created_at),
    services: attrs.services?.map(s => s.name) || [],
    environments: attrs.environments?.map(e => e.name) || [],
    summary: attrs.summary,
    createdBy: attrs.created_by ? {
      name: attrs.created_by.name,
      email: attrs.created_by.email,
      slackUserId: attrs.created_by.slack_user_id,
    } : undefined,
  };
}

// Transform Rootly alert to TheBridge format
function transformAlert(alert: RootlyAlert): ActiveAlert {
  const attrs = alert.attributes;

  return {
    id: alert.id,
    shortId: attrs.short_id,
    source: attrs.source,
    status: attrs.status,
    summary: attrs.summary,
    urgency: attrs.alert_urgency?.urgency || 'medium',
    urgencyColor: attrs.alert_urgency?.color || '#888888',
    externalUrl: attrs.external_url,
    duration: formatDuration(attrs.started_at || attrs.created_at),
    startedAt: new Date(attrs.started_at || attrs.created_at),
    services: attrs.services?.map(s => s.name) || [],
  };
}

// Calculate MTTR from resolved incidents
function calculateMTTR(incidents: RootlyIncident[]): number | null {
  const resolvedIncidents = incidents.filter(
    i => i.attributes.status === 'resolved' &&
         i.attributes.started_at &&
         i.attributes.resolved_at
  );

  if (resolvedIncidents.length === 0) return null;

  const totalMinutes = resolvedIncidents.reduce((sum, incident) => {
    const start = new Date(incident.attributes.started_at!).getTime();
    const end = new Date(incident.attributes.resolved_at!).getTime();
    return sum + (end - start) / 60000;
  }, 0);

  return Math.round(totalMinutes / resolvedIncidents.length);
}

// Main function to fetch all Rootly dashboard data
export async function fetchRootlyDashboardData(
  apiKey: string
): Promise<RootlyDashboardData> {
  // Calculate date ranges
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Calculate month boundaries for monthly breakdown
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);

  // Month names
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonthName = monthNames[now.getMonth()];
  const previousMonthName = monthNames[(now.getMonth() - 1 + 12) % 12];
  const twoMonthsAgoName = monthNames[(now.getMonth() - 2 + 12) % 12];

  // Fetch active incidents (not resolved or cancelled)
  const activeIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[status]': 'in_triage,started,mitigated',
      'page[size]': '50',
      'sort': '-created_at',
    }
  );

  // Fetch recent incidents (last 30 days, ALL statuses for comprehensive view)
  const recentIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[created_at][gte]': thirtyDaysAgo.toISOString(),
      'page[size]': '300',
      'sort': '-created_at',
    }
  );

  // Fetch closed incidents specifically (to ensure we get all of them)
  const closedIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[status]': 'closed',
      'page[size]': '100',
      'sort': '-created_at',
    }
  );

  // Fetch cancelled incidents
  const cancelledIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[status]': 'cancelled',
      'page[size]': '100',
      'sort': '-created_at',
    }
  );

  // Fetch resolved incidents
  const resolvedIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[status]': 'resolved',
      'page[size]': '100',
      'sort': '-created_at',
    }
  );

  // Fetch monthly incidents
  const monthlyIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[created_at][gte]': startOfMonth.toISOString(),
      'page[size]': '200',
      'sort': '-created_at',
    }
  );

  // Fetch today's incidents
  const todayIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[created_at][gte]': startOfToday.toISOString(),
      'page[size]': '100',
      'sort': '-created_at',
    }
  );

  // Fetch previous month incidents
  const previousMonthIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[created_at][gte]': previousMonthStart.toISOString(),
      'filter[created_at][lte]': previousMonthEnd.toISOString(),
      'page[size]': '200',
      'sort': '-created_at',
    }
  );

  // Fetch two months ago incidents
  const twoMonthsAgoIncidentsResponse = await rootlyFetch<RootlyListResponse<RootlyIncident>>(
    '/incidents',
    apiKey,
    {
      'filter[created_at][gte]': twoMonthsAgoStart.toISOString(),
      'filter[created_at][lte]': twoMonthsAgoEnd.toISOString(),
      'page[size]': '200',
      'sort': '-created_at',
    }
  );

  // Fetch active alerts
  const activeAlertsResponse = await rootlyFetch<RootlyListResponse<RootlyAlert>>(
    '/alerts',
    apiKey,
    {
      'filter[status]': 'open,acknowledged',
      'page[size]': '50',
      'sort': '-created_at',
    }
  );

  // Fetch configuration counts in parallel (with error handling)
  const [alertSourcesResponse, escalationPoliciesResponse, workflowsResponse, servicesResponse, teamsResponse] = await Promise.allSettled([
    rootlyFetch<RootlyListResponse<any>>('/alert_sources', apiKey, { 'page[size]': '1' }),
    rootlyFetch<RootlyListResponse<any>>('/escalation_policies', apiKey, { 'page[size]': '1' }),
    rootlyFetch<RootlyListResponse<any>>('/workflows', apiKey, { 'page[size]': '1' }),
    rootlyFetch<RootlyListResponse<any>>('/services', apiKey, { 'page[size]': '1' }),
    rootlyFetch<RootlyListResponse<any>>('/teams', apiKey, { 'page[size]': '1' }),
  ]);

  // Transform data
  const activeIncidents = activeIncidentsResponse.data.map(transformIncident);

  // Combine all incidents and deduplicate by ID
  const allIncidentMap = new Map<string, ActiveIncident>();

  // Add recent incidents first
  recentIncidentsResponse.data.forEach(incident => {
    allIncidentMap.set(incident.id, transformIncident(incident));
  });

  // Add active incidents (will overwrite if duplicates)
  activeIncidentsResponse.data.forEach(incident => {
    allIncidentMap.set(incident.id, transformIncident(incident));
  });

  // Add closed incidents
  closedIncidentsResponse.data.forEach(incident => {
    allIncidentMap.set(incident.id, transformIncident(incident));
  });

  // Add cancelled incidents
  cancelledIncidentsResponse.data.forEach(incident => {
    allIncidentMap.set(incident.id, transformIncident(incident));
  });

  // Add resolved incidents
  resolvedIncidentsResponse.data.forEach(incident => {
    allIncidentMap.set(incident.id, transformIncident(incident));
  });

  // Convert map to array for recentIncidents
  const recentIncidents = Array.from(allIncidentMap.values());

  const activeAlerts = activeAlertsResponse.data.map(transformAlert);

  // Calculate time-based metrics
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const monthlyIncidents = monthlyIncidentsResponse.data;
  const todayIncidents = todayIncidentsResponse.data;

  // Monthly stats
  const incidentsCreatedThisMonth = monthlyIncidents.length;
  const incidentsResolvedThisMonth = monthlyIncidents.filter(
    i => i.attributes.status === 'resolved' &&
         i.attributes.resolved_at &&
         new Date(i.attributes.resolved_at) >= startOfMonth
  ).length;

  // Today stats
  const incidentsCreatedToday = todayIncidents.length;
  const incidentsResolvedToday = todayIncidents.filter(
    i => i.attributes.status === 'resolved' &&
         i.attributes.resolved_at
  ).length;

  // 24h stats
  const resolvedLast24h = recentIncidentsResponse.data.filter(
    i => i.attributes.status === 'resolved' &&
         i.attributes.resolved_at &&
         new Date(i.attributes.resolved_at) > oneDayAgo
  ).length;

  // Calculate average response time (time to first acknowledge)
  const acknowledgedIncidents = monthlyIncidents.filter(
    i => i.attributes.acknowledged_at && i.attributes.created_at
  );

  const avgResponseTimeMinutes = acknowledgedIncidents.length > 0
    ? Math.round(
        acknowledgedIncidents.reduce((sum, incident) => {
          const created = new Date(incident.attributes.created_at).getTime();
          const acked = new Date(incident.attributes.acknowledged_at!).getTime();
          return sum + (acked - created) / 60000;
        }, 0) / acknowledgedIncidents.length
      )
    : null;

  // Count by status
  const byStatus = {
    inTriage: activeIncidents.filter(i => i.status === 'in_triage').length,
    started: activeIncidents.filter(i => i.status === 'started').length,
    mitigated: activeIncidents.filter(i => i.status === 'mitigated').length,
  };

  // Count by severity
  const bySeverity = {
    sev1: activeIncidents.filter(i => i.priority === 'P1').length,
    sev2: activeIncidents.filter(i => i.priority === 'P2').length,
    sev3: activeIncidents.filter(i => i.priority === 'P3').length,
    sev4: activeIncidents.filter(i => i.priority === 'P4').length,
  };

  return {
    activeIncidents,
    recentIncidents,
    activeAlerts,
    summary: {
      activeIncidentCount: activeIncidents.length,
      activeAlertCount: activeAlerts.length,
      activeAlertCountAtLimit: activeAlerts.length === 50, // API limit reached
      resolvedLast24h,
      mttrMinutes: calculateMTTR(recentIncidentsResponse.data),
      byStatus,
      bySeverity,
    },
    timeBasedMetrics: {
      today: {
        created: incidentsCreatedToday,
        resolved: incidentsResolvedToday,
      },
      thisMonth: {
        created: incidentsCreatedThisMonth,
        resolved: incidentsResolvedThisMonth,
      },
      avgResponseTimeMinutes,
      monthlyBreakdown: {
        currentMonth: {
          name: currentMonthName,
          incidents: incidentsCreatedThisMonth,
        },
        previousMonth: {
          name: previousMonthName,
          incidents: previousMonthIncidentsResponse.data.length,
        },
        twoMonthsAgo: {
          name: twoMonthsAgoName,
          incidents: twoMonthsAgoIncidentsResponse.data.length,
        },
      },
    },
    configuration: {
      alertSources: alertSourcesResponse.status === 'fulfilled' ? alertSourcesResponse.value.meta?.total_count || 0 : 0,
      escalationPolicies: escalationPoliciesResponse.status === 'fulfilled' ? escalationPoliciesResponse.value.meta?.total_count || 0 : 0,
      workflows: workflowsResponse.status === 'fulfilled' ? workflowsResponse.value.meta?.total_count || 0 : 0,
      services: servicesResponse.status === 'fulfilled' ? servicesResponse.value.meta?.total_count || 0 : 0,
      teams: teamsResponse.status === 'fulfilled' ? teamsResponse.value.meta?.total_count || 0 : 0,
    },
  };
}

// Update incident status (supports all status transitions)
export async function updateIncidentStatus(
  apiKey: string,
  incidentId: string,
  status: 'in_triage' | 'started' | 'mitigated' | 'resolved' | 'cancelled'
): Promise<void> {
  const body = {
    data: {
      type: 'incidents',
      id: incidentId,
      attributes: {
        status,
      },
    },
  };

  await rootlyFetch(
    `/incidents/${incidentId}`,
    apiKey,
    undefined,
    'PATCH',
    body
  );
}

// Fetch comments for an incident
export async function fetchIncidentComments(
  apiKey: string,
  incidentId: string
): Promise<RootlyComment[]> {
  const response = await rootlyFetch<RootlyListResponse<RootlyComment>>(
    `/incidents/${incidentId}/incident_events`,
    apiKey,
    {
      'filter[kind]': 'incident_note',
      'page[size]': '50',
      'sort': '-created_at',
    }
  );

  return response.data;
}

// Post a comment on an incident
export async function postIncidentComment(
  apiKey: string,
  incidentId: string,
  body: string
): Promise<void> {
  const payload = {
    data: {
      type: 'incident_events',
      attributes: {
        kind: 'incident_note',
        body,
      },
    },
  };

  await rootlyFetch(
    `/incidents/${incidentId}/incident_events`,
    apiKey,
    undefined,
    'POST',
    payload
  );
}

// Get direct incident URL
export function getIncidentUrl(sequentialId: number): string {
  // Rootly incident URLs follow this pattern
  return `https://rootly.com/account/incidents/${sequentialId}`;
}
