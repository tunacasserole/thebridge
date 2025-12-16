/**
 * Tools Data Definitions
 * MCP tools, core agent tools, and MCP integrations
 */

import type { ToolDefinition, AgentDefinition } from './types';
import { RootlyLogo, CoralogixLogo, NewRelicLogo, KubernetesLogo, MetabaseLogo, PrometheusLogo } from '../logos';

// MCP Tools data - available tools for each MCP integration
export const MCP_TOOLS: Record<string, { name: string; description: string }[]> = {
  metabase: [
    { name: 'list_databases', description: 'List all available databases' },
    { name: 'get_database', description: 'Get details of a specific database' },
    { name: 'list_tables', description: 'List tables in a database' },
    { name: 'execute_query', description: 'Execute a Metabase query' },
    { name: 'list_dashboards', description: 'List all dashboards' },
    { name: 'get_dashboard', description: 'Get dashboard details' },
    { name: 'list_cards', description: 'List saved questions/cards' },
    { name: 'get_card', description: 'Get card/question details' },
  ],
  newrelic: [
    { name: 'run_nrql_query', description: 'Execute NRQL query against New Relic data' },
    { name: 'get_alert_policies', description: 'List alert policies' },
    { name: 'get_alert_policy', description: 'Get specific alert policy details' },
    { name: 'create_alert_policy', description: 'Create a new alert policy' },
    { name: 'update_alert_policy', description: 'Update an existing alert policy' },
    { name: 'delete_alert_policy', description: 'Delete an alert policy' },
    { name: 'get_alert_conditions', description: 'Get alert conditions for a policy' },
    { name: 'create_alert_condition', description: 'Create a new alert condition' },
    { name: 'update_alert_condition', description: 'Update an existing alert condition' },
    { name: 'delete_alert_condition', description: 'Delete an alert condition' },
    { name: 'get_notification_channels', description: 'List notification channels' },
    { name: 'get_notification_destinations', description: 'List notification destinations' },
    { name: 'get_entities', description: 'Search for monitored entities' },
    { name: 'get_entity', description: 'Get entity details by GUID' },
    { name: 'get_entity_relationships', description: 'Get entity relationships' },
    { name: 'get_entity_tags', description: 'Get tags for an entity' },
    { name: 'add_entity_tags', description: 'Add tags to an entity' },
    { name: 'delete_entity_tags', description: 'Remove tags from an entity' },
    { name: 'get_apm_applications', description: 'List APM applications' },
    { name: 'get_apm_application', description: 'Get APM application details' },
    { name: 'get_apm_summary', description: 'Get APM application summary metrics' },
    { name: 'get_deployments', description: 'List deployments for an application' },
    { name: 'create_deployment', description: 'Record a new deployment' },
    { name: 'get_dashboards', description: 'List dashboards' },
    { name: 'get_dashboard', description: 'Get dashboard details' },
    { name: 'get_incidents', description: 'List active incidents' },
    { name: 'get_incident', description: 'Get incident details' },
    { name: 'acknowledge_incident', description: 'Acknowledge an incident' },
    { name: 'close_incident', description: 'Close an incident' },
  ],
  github: [
    { name: 'search_repositories', description: 'Search GitHub repositories' },
    { name: 'get_file_contents', description: 'Get contents of a file' },
    { name: 'create_or_update_file', description: 'Create or update a file' },
    { name: 'push_files', description: 'Push multiple files' },
    { name: 'create_issue', description: 'Create a new issue' },
    { name: 'create_pull_request', description: 'Create a pull request' },
    { name: 'search_code', description: 'Search code across repos' },
    { name: 'list_commits', description: 'List repository commits' },
  ],
  slack: [
    { name: 'list_channels', description: 'List Slack channels' },
    { name: 'post_message', description: 'Post a message to a channel' },
    { name: 'reply_to_thread', description: 'Reply to a thread' },
    { name: 'get_channel_history', description: 'Get channel message history' },
    { name: 'get_thread_replies', description: 'Get thread replies' },
    { name: 'search_messages', description: 'Search messages' },
    { name: 'get_users', description: 'List workspace users' },
  ],
  jira: [
    { name: 'search_issues', description: 'Search Jira issues with JQL' },
    { name: 'get_issue', description: 'Get issue details' },
    { name: 'create_issue', description: 'Create a new issue' },
    { name: 'update_issue', description: 'Update an existing issue' },
    { name: 'add_comment', description: 'Add comment to issue' },
    { name: 'get_projects', description: 'List Jira projects' },
    { name: 'transition_issue', description: 'Change issue status' },
  ],
  confluence: [
    { name: 'search_content', description: 'Search Confluence content' },
    { name: 'get_page', description: 'Get page content' },
    { name: 'create_page', description: 'Create a new page' },
    { name: 'update_page', description: 'Update existing page' },
    { name: 'get_spaces', description: 'List Confluence spaces' },
    { name: 'get_space', description: 'Get space details' },
  ],
  kubernetes: [
    { name: 'list_pods', description: 'List pods in namespace' },
    { name: 'get_pod', description: 'Get pod details' },
    { name: 'get_pod_logs', description: 'Get pod logs' },
    { name: 'list_deployments', description: 'List deployments' },
    { name: 'list_services', description: 'List services' },
    { name: 'list_namespaces', description: 'List namespaces' },
    { name: 'describe_resource', description: 'Describe any resource' },
    { name: 'apply_manifest', description: 'Apply a K8s manifest' },
  ],
  coralogix: [
    { name: 'search_logs', description: 'Search log entries' },
    { name: 'get_alerts', description: 'List alerts' },
    { name: 'query_archive', description: 'Query archived logs' },
    { name: 'get_teams', description: 'List teams' },
    { name: 'run_dataprime', description: 'Run DataPrime query' },
  ],
  rootly: [
    { name: 'list_incidents', description: 'List incidents' },
    { name: 'get_incident', description: 'Get incident details' },
    { name: 'create_incident', description: 'Create new incident' },
    { name: 'update_incident', description: 'Update incident' },
    { name: 'list_services', description: 'List services' },
    { name: 'list_teams', description: 'List teams' },
    { name: 'add_timeline_event', description: 'Add timeline event' },
  ],
  prometheus: [
    { name: 'query', description: 'Execute PromQL instant query' },
    { name: 'query_range', description: 'Execute PromQL range query' },
    { name: 'list_metrics', description: 'List available metrics' },
    { name: 'get_targets', description: 'Get scrape targets' },
    { name: 'get_alerts', description: 'Get active alerts' },
    { name: 'get_rules', description: 'Get alerting rules' },
  ],
  salesforce: [
    { name: 'query_records', description: 'Query Salesforce records with SOQL' },
    { name: 'get_record', description: 'Get a specific record by ID' },
    { name: 'create_record', description: 'Create a new record' },
    { name: 'update_record', description: 'Update an existing record' },
    { name: 'delete_record', description: 'Delete a record' },
    { name: 'list_objects', description: 'List available Salesforce objects' },
    { name: 'describe_object', description: 'Get object schema/metadata' },
    { name: 'search_records', description: 'Search records with SOSL' },
    { name: 'get_opportunities', description: 'List sales opportunities' },
    { name: 'get_leads', description: 'List leads' },
    { name: 'get_accounts', description: 'List accounts' },
    { name: 'get_contacts', description: 'List contacts' },
  ],
  hubspot: [
    { name: 'list_contacts', description: 'List HubSpot contacts' },
    { name: 'get_contact', description: 'Get contact details' },
    { name: 'create_contact', description: 'Create a new contact' },
    { name: 'update_contact', description: 'Update contact properties' },
    { name: 'list_companies', description: 'List companies' },
    { name: 'get_company', description: 'Get company details' },
    { name: 'list_deals', description: 'List deals in pipeline' },
    { name: 'get_deal', description: 'Get deal details' },
    { name: 'create_deal', description: 'Create a new deal' },
    { name: 'update_deal', description: 'Update deal properties' },
    { name: 'list_tickets', description: 'List support tickets' },
    { name: 'search_crm', description: 'Search CRM objects' },
    { name: 'get_analytics', description: 'Get marketing analytics' },
  ],
};

// Core agent tools (built-in capabilities) - sorted alphabetically
export const coreTools: ToolDefinition[] = [
  {
    id: 'bash',
    name: 'Bash',
    description: 'Run commands',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    ),
  },
  {
    id: 'edit',
    name: 'Edit',
    description: 'Modify files',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: 'glob',
    name: 'Glob',
    description: 'Find files',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    ),
  },
  {
    id: 'grep',
    name: 'Grep',
    description: 'Search content',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'httprequest',
    name: 'HTTP Request',
    description: 'Call APIs',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    id: 'jsonyaml',
    name: 'JSON/YAML',
    description: 'Parse & format',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <path d="M10 12h4M10 16h4M10 8h1" />
      </svg>
    ),
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Persist context',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2" />
        <line x1="6" y1="10" x2="6" y2="14" />
        <line x1="10" y1="10" x2="10" y2="14" />
        <line x1="14" y1="10" x2="14" y2="14" />
        <line x1="18" y1="10" x2="18" y2="14" />
      </svg>
    ),
  },
  {
    id: 'read',
    name: 'Read',
    description: 'Read files',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10,9 9,9 8,9" />
      </svg>
    ),
  },
  {
    id: 'shellcommand',
    name: 'Shell Command',
    description: 'Safe shell exec',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
        <circle cx="17" cy="7" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'task',
    name: 'Task',
    description: 'Spawn sub-agents',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <circle cx="4" cy="8" r="2" />
        <circle cx="4" cy="16" r="2" />
        <circle cx="20" cy="8" r="2" />
        <circle cx="20" cy="16" r="2" />
        <line x1="6" y1="8" x2="9" y2="10" />
        <line x1="6" y1="16" x2="9" y2="14" />
        <line x1="18" y1="8" x2="15" y2="10" />
        <line x1="18" y1="16" x2="15" y2="14" />
      </svg>
    ),
  },
  {
    id: 'webfetch',
    name: 'WebFetch',
    description: 'Fetch URLs',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
  {
    id: 'websearch',
    name: 'WebSearch',
    description: 'Search the web',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
  {
    id: 'write',
    name: 'Write',
    description: 'Create files',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.375 2.625a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.375-9.375z" />
      </svg>
    ),
  },
];

// All core tool IDs for default enabling
export const CORE_TOOL_IDS = coreTools.map(t => t.id);

// Observability MCP integrations
export const observabilityMcps: ToolDefinition[] = [
  {
    id: 'coralogix',
    name: 'Coralogix',
    description: 'Log search & analysis',
    icon: <CoralogixLogo width={20} height={20} />,
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Cluster management',
    icon: <KubernetesLogo width={20} height={20} className="text-[#326CE5]" />,
  },
  {
    id: 'metabase',
    name: 'Metabase',
    description: 'SQL & dashboards',
    icon: <MetabaseLogo width={20} height={20} />,
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    description: 'APM & metrics',
    icon: <NewRelicLogo width={20} height={20} className="text-[#1CE783]" />,
  },
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Metrics collection',
    icon: <PrometheusLogo width={20} height={20} className="text-[#E6522C]" />,
  },
  {
    id: 'rootly',
    name: 'Rootly',
    description: 'Incident management',
    icon: <RootlyLogo width={20} height={20} />,
  },
];

// Sales & Marketing MCP integrations
export const salesMarketingMcps: ToolDefinition[] = [
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'CRM & sales data',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#00A1E0]">
        <path d="M10.006 5.415a4.195 4.195 0 013.045-1.306c1.56 0 2.954.9 3.69 2.205.63-.3 1.35-.45 2.1-.45 2.85 0 5.159 2.34 5.159 5.22s-2.31 5.22-5.16 5.22c-.45 0-.884-.06-1.305-.165a3.865 3.865 0 01-3.42 2.07 3.92 3.92 0 01-2.16-.645 4.721 4.721 0 01-3.87 2.04c-2.28 0-4.229-1.59-4.739-3.75a4.49 4.49 0 01-.51.03c-2.25 0-4.08-1.86-4.08-4.14 0-1.665.99-3.09 2.415-3.735a4.583 4.583 0 01-.165-1.215c0-2.49 2.01-4.5 4.5-4.5 1.38 0 2.61.615 3.45 1.59l-.95.465z" />
      </svg>
    ),
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Marketing & CRM',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#FF7A59]">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.218 2.218 0 00-4.435 0c0 .873.515 1.622 1.255 1.977v2.859a5.263 5.263 0 00-2.919 1.527l-7.095-5.36a2.444 2.444 0 00.069-.544 2.435 2.435 0 10-2.435 2.435c.43 0 .832-.115 1.181-.313l6.986 5.277a5.3 5.3 0 00-.398 2.014 5.32 5.32 0 00.425 2.084l-2.148 1.744a1.89 1.89 0 00-1.182-.414 1.904 1.904 0 100 3.808 1.904 1.904 0 001.858-2.301l2.198-1.785a5.292 5.292 0 103.373-10.178zM17.14 17.32a2.735 2.735 0 110-5.47 2.735 2.735 0 010 5.47z" />
      </svg>
    ),
  },
];

// Productivity MCP integrations
export const productivityMcps: ToolDefinition[] = [
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Knowledge base',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2zm0 4h5v2H8v-2z" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    ),
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'CI/CD & repos',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
      </svg>
    ),
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Issue tracking',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.005 2c-5.52 0-9.995 4.48-9.995 10s4.475 10 9.995 10c5.52 0 10.005-4.48 10.005-10s-4.485-10-10.005-10zm0 18c-4.41 0-7.995-3.59-7.995-8s3.585-8 7.995-8c4.42 0 8.005 3.59 8.005 8s-3.585 8-8.005 8z" />
        <path d="M13 7h-2v5.414l3.293 3.293 1.414-1.414L13 11.586z" />
      </svg>
    ),
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notifications',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM6 14a2 2 0 100 4h4a2 2 0 100-4H6zM14 6a2 2 0 100-4 2 2 0 000 4zM10 6a2 2 0 100 4h4V6h-4zM18 14a2 2 0 110 4 2 2 0 010-4zM18 10a2 2 0 100-4h-4a2 2 0 100 4h4zM10 18a2 2 0 104 0v-4h-4v4z" />
      </svg>
    ),
  },
];

// Agents - role-aware (roles: undefined means visible to all roles)
export const agents: AgentDefinition[] = [
  // SRE & Commander agents
  {
    id: 'general',
    name: 'General',
    description: 'Multi-purpose assistant',
    accentColor: '#6366f1', // Indigo
    roles: ['sre', 'commander'],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: 'incident',
    name: 'Incident',
    description: 'Root cause analysis',
    accentColor: '#f59e0b', // Amber
    roles: ['sre', 'commander'],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    id: 'quota',
    name: 'Quota',
    description: 'Cost optimization',
    accentColor: '#10b981', // Emerald
    roles: ['sre', 'commander'],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  // PM agents
  {
    id: 'story-creator',
    name: 'Story Creator',
    description: 'Expert user story & requirements writer',
    accentColor: '#8b5cf6', // Purple (matches PM role color)
    roles: ['pm'],
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
];

// All tool IDs for default enabling
export const OBSERVABILITY_MCP_IDS = observabilityMcps.map(t => t.id);
export const SALES_MARKETING_MCP_IDS = salesMarketingMcps.map(t => t.id);
export const PRODUCTIVITY_MCP_IDS = productivityMcps.map(t => t.id);
export const AGENT_IDS = agents.map(a => a.id);

// Helper to get agents filtered by role
import type { UserRole } from '@/types/roles';
export function getAgentsForRole(role: UserRole): AgentDefinition[] {
  return agents.filter(agent => !agent.roles || agent.roles.includes(role));
}

// All MCP server IDs (these can actually connect to MCP servers in .mcp.json)
// Note: CORE_TOOL_IDS (bash, edit, glob, grep, etc.) are UI-only definitions
// that represent tools Claude has natively - they don't have MCP server configs
export const ALL_MCP_SERVER_IDS = [
  ...OBSERVABILITY_MCP_IDS,
  ...SALES_MARKETING_MCP_IDS,
  ...PRODUCTIVITY_MCP_IDS,
];

// Exclude tools that need additional configuration
// slack needs SLACK_TEAM_ID, salesforce/hubspot need API credentials
const DISABLED_BY_DEFAULT = ['slack', 'salesforce', 'hubspot'];
export const ALL_TOOL_IDS = [
  ...CORE_TOOL_IDS,
  ...OBSERVABILITY_MCP_IDS,
  ...SALES_MARKETING_MCP_IDS,
  ...PRODUCTIVITY_MCP_IDS,
  ...AGENT_IDS
].filter(id => !DISABLED_BY_DEFAULT.includes(id));
