/**
 * Calls by Status Chart component
 * Donut chart showing distribution of calls by status
 */

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useSummaryStats } from '@/hooks/useDashboardData';

export const CallsByStatusChart: React.FC = () => {
  const { summaryStats, isLoadingSummary } = useSummaryStats();
  const [period, setPeriod] = useState<'year' | 'month' | 'week'>('year');

  if (isLoadingSummary) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate call distribution
  const totalCalls = summaryStats?.totalCalls || 0;
  const answeredCalls = summaryStats?.answeredCalls || 0;
  const missedCalls = summaryStats?.missedCalls || 0;
  const otherCalls = totalCalls - answeredCalls - missedCalls;

  const data = [
    {
      name: 'Answered',
      value: answeredCalls,
      percentage: totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : '0',
      color: '#10b981', // Green
    },
    {
      name: 'Missed',
      value: missedCalls,
      percentage: totalCalls > 0 ? ((missedCalls / totalCalls) * 100).toFixed(1) : '0',
      color: '#ef4444', // Red
    },
    {
      name: 'Other',
      value: otherCalls,
      percentage: totalCalls > 0 ? ((otherCalls / totalCalls) * 100).toFixed(1) : '0',
      color: '#f59e0b', // Orange
    },
  ].filter((item) => item.value > 0);

  const COLORS = data.map((item) => item.color);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} calls ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Calls by Status</h2>
          <p className="text-sm text-gray-500">Distribution of call outcomes</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'year' | 'month' | 'week')}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        >
          <option value="year">This year</option>
          <option value="month">This month</option>
          <option value="week">This week</option>
        </select>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label={({ percentage }) => `${percentage}%`}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={60}
              formatter={(value, entry: any) => (
                <span className="flex items-center space-x-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span>{value}</span>
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

