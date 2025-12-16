/**
 * Metabase Integration
 *
 * Provides access to Metabase dashboards, questions, and SQL queries
 * via the Metabase API.
 */

const METABASE_URL = process.env.METABASE_URL;
const METABASE_API_KEY = process.env.METABASE_API_KEY;

interface MetabaseRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
}

async function metabaseRequest<T>(
  endpoint: string,
  options: MetabaseRequestOptions = {}
): Promise<T> {
  if (!METABASE_URL || !METABASE_API_KEY) {
    throw new Error('Metabase configuration missing. Set METABASE_URL and METABASE_API_KEY.');
  }

  const { method = 'GET', body } = options;

  const response = await fetch(`${METABASE_URL}/api${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': METABASE_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Metabase API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Types
export interface MetabaseDatabase {
  id: number;
  name: string;
  engine: string;
  tables?: MetabaseTable[];
}

export interface MetabaseTable {
  id: number;
  name: string;
  display_name: string;
  schema: string;
  db_id: number;
}

export interface MetabaseQuestion {
  id: number;
  name: string;
  description?: string;
  display: string;
  collection_id?: number;
  database_id: number;
}

export interface MetabaseDashboard {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
}

export interface MetabaseCollection {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
}

export interface QueryResult {
  data: {
    rows: unknown[][];
    cols: { name: string; display_name: string; base_type: string }[];
    native_form?: { query: string };
  };
  row_count: number;
  status: string;
}

// API Functions

/**
 * List all databases in Metabase
 */
export async function listDatabases(): Promise<MetabaseDatabase[]> {
  const response = await metabaseRequest<{ data: MetabaseDatabase[] }>('/database');
  return response.data;
}

/**
 * Get database details including tables
 */
export async function getDatabase(databaseId: number): Promise<MetabaseDatabase> {
  return metabaseRequest<MetabaseDatabase>(`/database/${databaseId}?include=tables`);
}

/**
 * List tables in a database
 */
export async function listTables(databaseId: number): Promise<MetabaseTable[]> {
  const response = await metabaseRequest<MetabaseTable[]>(`/database/${databaseId}/tables`);
  return response;
}

/**
 * Get table metadata (columns, etc.)
 */
export async function getTableMetadata(tableId: number): Promise<unknown> {
  return metabaseRequest(`/table/${tableId}/query_metadata`);
}

/**
 * Execute a native SQL query against a database
 */
export async function executeQuery(
  databaseId: number,
  sql: string
): Promise<QueryResult> {
  return metabaseRequest<QueryResult>('/dataset', {
    method: 'POST',
    body: {
      database: databaseId,
      type: 'native',
      native: {
        query: sql,
      },
    },
  });
}

/**
 * Get a saved question by ID
 */
export async function getQuestion(questionId: number): Promise<MetabaseQuestion> {
  return metabaseRequest<MetabaseQuestion>(`/card/${questionId}`);
}

/**
 * Run a saved question and get results
 */
export async function runQuestion(questionId: number): Promise<QueryResult> {
  return metabaseRequest<QueryResult>(`/card/${questionId}/query`, {
    method: 'POST',
  });
}

/**
 * Search for questions by name
 */
export async function searchQuestions(query: string): Promise<MetabaseQuestion[]> {
  const response = await metabaseRequest<MetabaseQuestion[]>(
    `/search?q=${encodeURIComponent(query)}&models=card`
  );
  return response;
}

/**
 * List all dashboards
 */
export async function listDashboards(): Promise<MetabaseDashboard[]> {
  const response = await metabaseRequest<MetabaseDashboard[]>('/dashboard');
  return response;
}

/**
 * Get dashboard details including cards
 */
export async function getDashboard(dashboardId: number): Promise<unknown> {
  return metabaseRequest(`/dashboard/${dashboardId}`);
}

/**
 * List collections
 */
export async function listCollections(): Promise<MetabaseCollection[]> {
  return metabaseRequest<MetabaseCollection[]>('/collection');
}

/**
 * Get items in a collection
 */
export async function getCollectionItems(collectionId: number | 'root'): Promise<unknown> {
  return metabaseRequest(`/collection/${collectionId}/items`);
}

// Helper function to format query results as a table string
export function formatQueryResults(result: QueryResult): string {
  if (!result.data?.rows?.length) {
    return 'No results returned.';
  }

  const columns = result.data.cols.map((c) => c.display_name || c.name);
  const rows = result.data.rows;

  // Calculate column widths
  const widths = columns.map((col, i) => {
    const maxDataWidth = Math.max(...rows.map((row) => String(row[i] ?? '').length));
    return Math.max(col.length, maxDataWidth, 4);
  });

  // Build table
  const separator = '+' + widths.map((w) => '-'.repeat(w + 2)).join('+') + '+';
  const header =
    '|' + columns.map((col, i) => ` ${col.padEnd(widths[i])} `).join('|') + '|';
  const dataRows = rows.map(
    (row) =>
      '|' +
      row.map((cell, i) => ` ${String(cell ?? '').padEnd(widths[i])} `).join('|') +
      '|'
  );

  return [separator, header, separator, ...dataRows, separator].join('\n');
}

// Test connection
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const databases = await listDatabases();
    return {
      success: true,
      message: `Connected to Metabase. Found ${databases.length} database(s).`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
