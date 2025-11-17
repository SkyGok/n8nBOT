/**
 * ROI Chart Component
 * Visualizes ROI data using Recharts
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/utils/roiCalculations';

export interface ROIChartData {
  adSpend: number;
  totalRevenue: number;
  profit: number;
}

export interface ROIChartProps {
  data: ROIChartData;
  isLoading?: boolean;
}

export const ROIChart: React.FC<ROIChartProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue vs. Ad Spend</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Loading chart data...
        </div>
      </div>
    );
  }

  const chartData = [
    {
      name: 'Ad Spend',
      value: data.adSpend,
      fill: '#ef4444', // red-500
    },
    {
      name: 'Total Revenue',
      value: data.totalRevenue,
      fill: '#10b981', // green-500
    },
    {
      name: 'Profit',
      value: data.profit,
      fill: data.profit >= 0 ? '#3b82f6' : '#ef4444', // blue-500 or red-500
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].payload.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue vs. Ad Spend</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            stroke="#6b7280"
            style={{ fontSize: '14px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '14px' }}
            tickFormatter={(value) => {
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}k`;
              }
              return `$${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="value" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

