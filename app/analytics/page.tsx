/**
 * Analytics Page
 *
 * Displays token usage analytics dashboard with real-time metrics,
 * cost tracking, and budget monitoring.
 */

import TokenUsageDashboard from '@/components/TokenUsageDashboard';

export const metadata = {
  title: 'Analytics - TheBridge',
  description: 'Token usage and cost analytics',
};

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TokenUsageDashboard />
    </main>
  );
}
