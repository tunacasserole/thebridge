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
    // Query New Relic NerdGraph API for applications
    const query = `
      {
        actor {
          entitySearch(query: "domain = 'APM' AND type = 'APPLICATION'") {
            results {
              entities {
                guid
                name
                alertSeverity
                reporting
                ... on ApmApplicationEntityOutline {
                  language
                  settings {
                    apdexTarget
                  }
                }
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

    // Map to application format
    const applications = entities.map((entity: any, index: number) => ({
      id: index + 1,
      name: entity.name,
      health_status: mapAlertSeverity(entity.alertSeverity),
      reporting: entity.reporting ?? true,
      language: entity.language || 'Unknown',
    }));

    // Calculate summary
    const summary = {
      healthy: applications.filter((app: any) => app.health_status === 'green').length,
      warning: applications.filter((app: any) => app.health_status === 'yellow').length,
      critical: applications.filter((app: any) => app.health_status === 'red').length,
      notReporting: applications.filter((app: any) => !app.reporting || app.health_status === 'gray').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        applications,
        summary,
      },
    });
  } catch (error) {
    console.error('New Relic API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch New Relic data',
      },
      { status: 500 }
    );
  }
}

function mapAlertSeverity(severity: string | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (!severity) return 'gray';

  switch (severity.toUpperCase()) {
    case 'NOT_ALERTING':
      return 'green';
    case 'WARNING':
      return 'yellow';
    case 'CRITICAL':
      return 'red';
    case 'NOT_CONFIGURED':
    default:
      return 'gray';
  }
}
