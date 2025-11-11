/**
 * Call Summary Chart component
 * Visual summary showing customer call coverage and success rate
 * Displays ratio of called customers and percentage of successful calls
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CallSummaryChartProps {
  totalCustomers: number;
  calledCustomers: number;
  successfulCalls: number;
  isLoading?: boolean;
}

// Custom label for pie chart that shows percentage
const renderCustomLabel = (entry: { name: string; value: number; percent: number }) => {
  return `${entry.name}: ${(entry.percent * 100).toFixed(1)}%`;
};

// Custom tooltip for better formatting
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {payload[0].value.toLocaleString()} ({((payload[0].payload.percent || 0) * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const CallSummaryChart: React.FC<CallSummaryChartProps> = ({
  totalCustomers,
  calledCustomers,
  successfulCalls,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const notCalledCustomers = totalCustomers - calledCustomers;
  const failedCalls = calledCustomers - successfulCalls;
  const callCoveragePercent = totalCustomers > 0 ? (calledCustomers / totalCustomers) * 100 : 0;
  const successRatePercent = calledCustomers > 0 ? (successfulCalls / calledCustomers) * 100 : 0;

  // Data for customer coverage pie chart
  const coverageData = [
    { name: 'Called', value: calledCustomers, color: '#0ea5e9' },
    { name: 'Not Called', value: notCalledCustomers, color: '#e5e7eb' },
  ];

  // Data for call success pie chart
  const successData = [
    { name: 'Successful', value: successfulCalls, color: '#10b981' },
    { name: 'Failed', value: failedCalls, color: '#ef4444' },
  ];

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Call Performance Summary</h2>
        <p className="text-sm text-gray-500">Visual overview of customer outreach and call success metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Coverage Chart */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Coverage</h3>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">{callCoveragePercent.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Coverage Rate</p>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={coverageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {coverageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-gray-900">{calledCustomers.toLocaleString()}</p>
              <p className="text-gray-500">Called</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{totalCustomers.toLocaleString()}</p>
              <p className="text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Call Success Rate Chart */}
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Call Success Rate</h3>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{successRatePercent.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">Success Rate</p>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={successData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {successData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 text-sm">
            <div className="text-center">
              <p className="font-semibold text-green-600">{successfulCalls.toLocaleString()}</p>
              <p className="text-gray-500">Successful</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-900">{calledCustomers.toLocaleString()}</p>
              <p className="text-gray-500">Total Calls</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalCustomers.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Customers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">{calledCustomers.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Customers Called</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{successfulCalls.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Successful Calls</p>
          </div>
        </div>
      </div>
    </div>
  );
};

