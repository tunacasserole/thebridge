// Metabase API Types

export interface MetabaseDashboard {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  creator_id: number;
  public_uuid: string | null;
  archived: boolean;
  collection_id: number | null;
}

export interface MetabaseCard {
  id: number;
  name: string;
  description: string | null;
  display: 'table' | 'bar' | 'line' | 'pie' | 'scalar' | 'gauge' | 'map';
  dataset_query: Record<string, any>;
  database_id: number;
  created_at: string;
  updated_at: string;
  query_average_duration: number | null;
  last_query_start: string | null;
}

export interface MetabaseDatabase {
  id: number;
  name: string;
  engine: 'postgres' | 'mysql' | 'snowflake' | 'bigquery' | 'mongodb' | 'redshift' | 'sqlite' | 'h2';
  details: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_sample: boolean;
  is_full_sync: boolean;
  is_on_demand: boolean;
  schedules: Record<string, any>;
  native_permissions: 'write' | 'none';
}

export interface MetabaseActivity {
  id: number;
  topic: string;
  timestamp: string;
  user_id: number;
  model: string;
  model_id: number;
  details: Record<string, any>;
}

export interface MetabaseHealth {
  database_connections: {
    id: number;
    name: string;
    engine: string;
    status: 'healthy' | 'warning' | 'critical';
    last_sync: string | null;
  }[];
  slow_queries: {
    card_id: number;
    card_name: string;
    average_duration_ms: number;
    last_run: string;
  }[];
  failed_queries: {
    card_id: number;
    card_name: string;
    error: string;
    timestamp: string;
  }[];
}

export interface MetabaseStats {
  dashboards: {
    total: number;
    active: number;
    archived: number;
    public: number;
  };
  cards: {
    total: number;
    by_display_type: Record<string, number>;
    slow_queries: number; // > 10s average
    failed_recent: number; // last 24h
  };
  databases: {
    total: number;
    by_engine: Record<string, number>;
    health_status: {
      healthy: number;
      warning: number;
      critical: number;
    };
    list: {
      id: number;
      name: string;
      engine: string;
      is_sample: boolean;
    }[];
  };
  activity: {
    queries_24h: number;
    unique_users_24h: number;
    dashboard_views_24h: number;
  };
  health: 'healthy' | 'warning' | 'critical';
  lastUpdated: Date;
}

export interface MetabaseConfig {
  url: string;
  username?: string;
  password?: string;
  apiKey?: string; // For API key authentication
  sessionId?: string; // For session authentication
}

export interface MetabaseSession {
  id: string;
  'anti-csrf-token': string;
}

export interface MetabaseQueryRequest {
  database: number;
  type: 'native' | 'query';
  native?: {
    query: string;
    template_tags?: Record<string, any>;
  };
  query?: Record<string, any>;
}

export interface MetabaseQueryResult {
  data: {
    rows: any[][];
    cols: {
      name: string;
      display_name: string;
      base_type: string;
    }[];
  };
  row_count: number;
  status: 'completed' | 'failed';
  context: string;
  json_query: Record<string, any>;
  started_at: string;
  running_time: number;
}

export interface MetabaseTable {
  id: number;
  name: string;
  display_name: string;
  schema: string | null;
  db_id: number;
  active: boolean;
  entity_type: 'entity/GenericTable' | 'entity/UserTable' | 'entity/ProductTable' | null;
  visibility_type: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetabaseField {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  table_id: number;
  base_type: string;
  semantic_type: string | null;
  visibility_type: 'normal' | 'hidden' | 'retired' | 'sensitive' | 'details-only';
  has_field_values: 'none' | 'list' | 'search';
  position: number;
  preview_display: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetabaseDatabaseWithSchema {
  id: number;
  name: string;
  engine: string;
  is_sample: boolean;
  tables: {
    id: number;
    name: string;
    display_name: string;
    schema: string | null;
    entity_type: string | null;
    fields?: {
      id: number;
      name: string;
      display_name: string;
      base_type: string;
      semantic_type: string | null;
    }[];
  }[];
}
