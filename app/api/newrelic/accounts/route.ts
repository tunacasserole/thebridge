import { NextResponse } from 'next/server';

// New Relic API configuration
const NEW_RELIC_API_KEY = process.env.NEW_RELIC_API_KEY;
const NEW_RELIC_ACCOUNT_ID = process.env.NEW_RELIC_ACCOUNT_ID;

export async function GET() {
  // Check configuration
  if (!NEW_RELIC_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'New Relic is not configured. Add NEW_RELIC_API_KEY to your environment variables.',
      },
      { status: 503 }
    );
  }

  try {
    // Query New Relic NerdGraph API for accessible accounts
    const query = `
      {
        actor {
          accounts {
            id
            name
            reportingEventTypes
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

    const accounts = result.data?.actor?.accounts || [];

    // Map to simplified account format and mark the current/default account
    const mappedAccounts = accounts.map((account: {
      id: number;
      name: string;
      reportingEventTypes: string[];
    }) => ({
      id: account.id,
      name: account.name,
      isDefault: NEW_RELIC_ACCOUNT_ID ? account.id.toString() === NEW_RELIC_ACCOUNT_ID : false,
      hasData: account.reportingEventTypes && account.reportingEventTypes.length > 0,
    }));

    // Sort accounts: default first, then by name
    mappedAccounts.sort((a: { isDefault: boolean; name: string }, b: { isDefault: boolean; name: string }) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: mappedAccounts,
      currentAccountId: NEW_RELIC_ACCOUNT_ID ? parseInt(NEW_RELIC_ACCOUNT_ID) : null,
    });
  } catch (error) {
    console.error('New Relic Accounts API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch New Relic accounts',
      },
      { status: 500 }
    );
  }
}
