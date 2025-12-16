import { NextResponse } from 'next/server';

// New Relic API configuration
const NEW_RELIC_API_KEY = process.env.NEW_RELIC_API_KEY;
const NEW_RELIC_ACCOUNT_ID = process.env.NEW_RELIC_ACCOUNT_ID;

export async function GET() {
  // Check configuration
  if (!NEW_RELIC_API_KEY || !NEW_RELIC_ACCOUNT_ID) {
    return NextResponse.json(
      {
        success: false,
        error: 'New Relic is not configured. Add NEW_RELIC_API_KEY and NEW_RELIC_ACCOUNT_ID to your environment variables.',
      },
      { status: 503 }
    );
  }

  try {
    // Query New Relic NerdGraph API for all entities
    const query = `
      {
        actor {
          entitySearch(query: "reporting = 'true'") {
            results {
              entities {
                guid
                name
                entityType
                domain
                alertSeverity
                reporting
              }
            }
          }
        }
      }
    `;

    const response = await fetch('https://api.newrelic.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': NEW_RELIC_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`New Relic API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors[0]?.message || 'GraphQL query error');
    }

    const entities = result.data?.actor?.entitySearch?.results?.entities || [];

    // Map to simplified entity format
    const mappedEntities = entities.map((entity: {
      guid: string;
      name: string;
      entityType: string;
      domain: string;
      alertSeverity: string | null;
      reporting: boolean;
    }) => ({
      guid: entity.guid,
      name: entity.name,
      entityType: entity.entityType || 'Unknown',
      domain: entity.domain || 'Unknown',
      alertSeverity: entity.alertSeverity || 'NOT_CONFIGURED',
    }));

    // Sort by entity type, then by name
    mappedEntities.sort((a: { entityType: string; name: string }, b: { entityType: string; name: string }) => {
      if (a.entityType !== b.entityType) {
        return a.entityType.localeCompare(b.entityType);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: mappedEntities,
    });
  } catch (error) {
    console.error('New Relic Entities API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch New Relic entities',
      },
      { status: 500 }
    );
  }
}
