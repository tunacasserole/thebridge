'use client';

/**
 * Token Usage Dashboard
 *
 * Real-time visualization of token consumption, costs, and trends.
 * Displays daily/weekly/monthly usage with alerts and projections.
 */

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface UsageSummary {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  totalCostFormatted: string;
  avgTokensPerCall: number;
  avgCostPerCall: number;
  avgCostPerCallFormatted: string;
  periodStart: string;
  periodEnd: string;
  periodDays: number;
}

interface ModelBreakdown {
  model: string;
  calls: number;
  tokens: number;
  tokensFormatted: string;
  cost: number;
  costFormatted: string;
  percentOfCalls: number;
  percentOfCost: number;
}

interface Projection {
  monthlyCalls: number;
  monthlyTokens: number;
  monthlyTokensFormatted: string;
  monthlyCost: number;
  monthlyCostFormatted: string;
  dailyAverage: {
    calls: number;
    tokens: number;
    tokensFormatted: string;
    cost: number;
    costFormatted: string;
  };
}

interface TimeSeriesPoint {
  date: string;
  tokens: number;
  tokensFormatted: string;
  cost: number;
  costFormatted: string;
  calls: number;
}

interface Alert {
  level: 'info' | 'warning' | 'critical';
  threshold: number;
  currentSpend: number;
  budgetLimit: number;
  percentUsed: number;
  message: string;
}

interface Anomaly {
  type: 'spike' | 'unusual_pattern' | 'high_cost';
  severity: 'low' | 'medium' | 'high';
  description: string;
  currentValue: number;
  normalValue: number;
  difference: number;
}

interface Budget {
  spent: number;
  spentFormatted: string;
  limit: number;
  limitFormatted: string;
  remaining: number;
  remainingFormatted: string;
  percentUsed: number;
  isOverBudget: boolean;
}

interface AnalyticsData {
  summary: UsageSummary;
  modelBreakdown: ModelBreakdown[];
  projection: Projection;
  timeSeries: TimeSeriesPoint[];
  alerts: Alert[];
  anomalies: Anomaly[];
  budget: Budget | null;
}

const COLORS = {
  sonnet: '#8884d8',
  opus: '#82ca9d',
  haiku: '#ffc658',
};

const ALERT_COLORS = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

export default function TokenUsageDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/tokens?range=${timeRange}&aggregation=daily`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Token Usage Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded ${
              timeRange === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded ${
              timeRange === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded ${
              timeRange === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border-l-4`}
              style={{
                borderColor: ALERT_COLORS[alert.level],
                backgroundColor: `${ALERT_COLORS[alert.level]}10`,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold capitalize">{alert.level}</span>
                <span>{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Anomalies */}
      {data.anomalies.length > 0 && (
        <div className="space-y-2">
          {data.anomalies.map((anomaly, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg bg-yellow-50 border border-yellow-200"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold">⚠️ Anomaly Detected:</span>
                <span>{anomaly.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget Status */}
      {data.budget && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Budget</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Spent: {data.budget.spentFormatted}</span>
                <span>Limit: {data.budget.limitFormatted}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full ${
                    data.budget.isOverBudget
                      ? 'bg-red-500'
                      : data.budget.percentUsed > 75
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(data.budget.percentUsed, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {data.budget.percentUsed.toFixed(1)}% used • {data.budget.remainingFormatted}{' '}
                remaining
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Calls</div>
          <div className="text-2xl font-bold">{data.summary.totalCalls.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Tokens</div>
          <div className="text-2xl font-bold">{data.summary.totalTokens.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Cost</div>
          <div className="text-2xl font-bold">{data.summary.totalCostFormatted}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Avg Cost/Call</div>
          <div className="text-2xl font-bold">{data.summary.avgCostPerCallFormatted}</div>
        </div>
      </div>

      {/* Usage Over Time */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.timeSeries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tokens"
              stroke="#8884d8"
              name="Tokens"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#82ca9d"
              name="Cost (cents)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Model Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Usage by Model</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data.modelBreakdown}
                dataKey="calls"
                nameKey="model"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(entry) => `${entry.model}: ${entry.percentOfCalls.toFixed(1)}%`}
              >
                {data.modelBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.model as keyof typeof COLORS] || '#999'}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cost by Model</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.modelBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cost" fill="#8884d8" name="Cost (cents)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Projection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Projection</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Projected Calls</div>
            <div className="text-xl font-bold">
              {data.projection.monthlyCalls.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {data.projection.dailyAverage.calls} avg/day
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Projected Tokens</div>
            <div className="text-xl font-bold">{data.projection.monthlyTokensFormatted}</div>
            <div className="text-sm text-gray-500">
              {data.projection.dailyAverage.tokensFormatted} avg/day
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Projected Cost</div>
            <div className="text-xl font-bold">{data.projection.monthlyCostFormatted}</div>
            <div className="text-sm text-gray-500">
              {data.projection.dailyAverage.costFormatted} avg/day
            </div>
          </div>
        </div>
      </div>

      {/* Model Details Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Model Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Model</th>
                <th className="text-right py-2">Calls</th>
                <th className="text-right py-2">Tokens</th>
                <th className="text-right py-2">Cost</th>
                <th className="text-right py-2">% of Calls</th>
                <th className="text-right py-2">% of Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.modelBreakdown.map((model) => (
                <tr key={model.model} className="border-b">
                  <td className="py-2 font-medium">{model.model}</td>
                  <td className="text-right py-2">{model.calls.toLocaleString()}</td>
                  <td className="text-right py-2">{model.tokensFormatted}</td>
                  <td className="text-right py-2">{model.costFormatted}</td>
                  <td className="text-right py-2">{model.percentOfCalls.toFixed(1)}%</td>
                  <td className="text-right py-2">{model.percentOfCost.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
