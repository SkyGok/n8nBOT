/**
 * Revenue Stats Chart component
 * Line chart showing call statistics over time
 */

import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTimeSeriesData } from '@/hooks/useDashboardData';
import { format, parseISO, startOfWeek, startOfMonth, startOfYear, subWeeks } from 'date-fns';

export const RevenueStatsChart: React.FC = () => {
  const [period, setPeriod] = useState<'year' | 'month' | 'week'>('year');
  
  // Determine the time series period based on selected period
  const timeSeriesPeriod = useMemo(() => {
    switch (period) {
      case 'week':
        return 'day' as const;
      case 'month':
        return 'day' as const;
      case 'year':
        return 'month' as const;
      default:
        return 'day' as const;
    }
  }, [period]);

  const { timeSeriesData, isLoadingTimeSeries, timeSeriesError } = useTimeSeriesData('calls', timeSeriesPeriod);

  // Filter and format data based on selected period
  const chartData = useMemo(() => {
    if (!timeSeriesData?.data || timeSeriesData.data.length === 0) {
      return [];
    }

    const now = new Date();
    let startDate: Date;
    let dateFormatter: (date: Date) => string;

    switch (period) {
      case 'week':
        startDate = startOfWeek(subWeeks(now, 1));
        dateFormatter = (date: Date) => format(date, 'EEE'); // Mon, Tue, etc.
        break;
      case 'month':
        startDate = startOfMonth(now);
        dateFormatter = (date: Date) => format(date, 'MMM d'); // Jan 1, Jan 2, etc.
        break;
      case 'year':
        startDate = startOfYear(now);
        dateFormatter = (date: Date) => format(date, 'MMM'); // Jan, Feb, etc.
        break;
      default:
        startDate = startOfYear(now);
        dateFormatter = (date: Date) => format(date, 'MMM');
    }

    // Filter data to the selected period and group by date
    const filtered = timeSeriesData.data
      .filter(item => {
        const itemDate = parseISO(item.timestamp);
        return itemDate >= startDate && itemDate <= now;
      })
      .map(item => {
        const itemDate = parseISO(item.timestamp);
        return {
          date: itemDate,
          label: dateFormatter(itemDate),
          calls: item.value,
        };
      });

    // Group by label and sum values (for month/year views where multiple days might map to same label)
    const grouped = new Map<string, number>();
    filtered.forEach(item => {
      const existing = grouped.get(item.label) || 0;
      grouped.set(item.label, existing + item.calls);
    });

    // Convert to array and sort by date
    return Array.from(grouped.entries())
      .map(([label, calls]) => ({ label, calls }))
      .sort((a, b) => {
        // Find the first date that matches each label
        const aDate = filtered.find(f => f.label === a.label)?.date;
        const bDate = filtered.find(f => f.label === b.label)?.date;
        return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
      });
  }, [timeSeriesData, period]);

  // Calculate max value for Y-axis domain
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const max = Math.max(...chartData.map(d => d.calls));
    return Math.ceil(max * 1.1); // Add 10% padding
  }, [chartData]);

  if (isLoadingTimeSeries) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (timeSeriesError) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-2">Error loading call stats</p>
          <p className="text-sm text-gray-500">{timeSeriesError}</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Call Stats</h2>
            <p className="text-sm text-gray-500">Call volume overview</p>
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
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No data available for the selected period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Call Stats</h2>
          <p className="text-sm text-gray-500">
            {period === 'week' ? 'Daily' : period === 'month' ? 'Daily' : 'Monthly'} call volume overview
          </p>
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
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: '#6b7280' }}
              domain={[0, maxValue]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Calls']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="calls"
              stroke="#0ea5e9"
              strokeWidth={3}
              dot={{ fill: '#0ea5e9', r: 4 }}
              name="Total Calls"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

