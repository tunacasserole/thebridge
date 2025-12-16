import { NextRequest } from 'next/server';
import * as metabase from '@/lib/integrations/metabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'test':
        return Response.json(await metabase.testConnection());

      case 'databases':
        return Response.json(await metabase.listDatabases());

      case 'database': {
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing database id' }, { status: 400 });
        return Response.json(await metabase.getDatabase(parseInt(id)));
      }

      case 'tables': {
        const dbId = searchParams.get('databaseId');
        if (!dbId) return Response.json({ error: 'Missing databaseId' }, { status: 400 });
        return Response.json(await metabase.listTables(parseInt(dbId)));
      }

      case 'dashboards':
        return Response.json(await metabase.listDashboards());

      case 'dashboard': {
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing dashboard id' }, { status: 400 });
        return Response.json(await metabase.getDashboard(parseInt(id)));
      }

      case 'collections':
        return Response.json(await metabase.listCollections());

      case 'search': {
        const q = searchParams.get('q');
        if (!q) return Response.json({ error: 'Missing search query' }, { status: 400 });
        return Response.json(await metabase.searchQuestions(q));
      }

      case 'question': {
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing question id' }, { status: 400 });
        return Response.json(await metabase.getQuestion(parseInt(id)));
      }

      case 'run-question': {
        const id = searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing question id' }, { status: 400 });
        const result = await metabase.runQuestion(parseInt(id));
        return Response.json({
          ...result,
          formatted: metabase.formatQueryResults(result),
        });
      }

      default:
        return Response.json(
          { error: 'Invalid action. Valid actions: test, databases, database, tables, dashboards, dashboard, collections, search, question, run-question' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Metabase API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, databaseId, sql } = body;

    switch (action) {
      case 'query': {
        if (!databaseId || !sql) {
          return Response.json(
            { error: 'Missing databaseId or sql' },
            { status: 400 }
          );
        }
        const result = await metabase.executeQuery(databaseId, sql);
        return Response.json({
          ...result,
          formatted: metabase.formatQueryResults(result),
        });
      }

      default:
        return Response.json(
          { error: 'Invalid action. Valid POST actions: query' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Metabase API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
