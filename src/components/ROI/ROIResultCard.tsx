/**
 * ROI Result Card Component
 * Displays calculated ROI metrics in a card format
 */

import React from 'react';
import { ROIResults } from '@/utils/roiCalculations';
import { formatCurrency, formatPercentage, formatNumber } from '@/utils/roiCalculations';

export interface ROIResultCardProps {
  results: ROIResults;
  isLoading?: boolean;
}

export const ROIResultCard: React.FC<ROIResultCardProps> = ({ results, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Results</h2>
        <div className="text-center py-8 text-gray-500">Calculating...</div>
      </div>
    );
  }

  const isPositiveROI = results.roi >= 0;
  const isProfitable = results.profit >= 0;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Estimated Sales */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm font-medium text-blue-700 mb-1">Estimated Sales</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatNumber(results.estimatedSales, 1)}
          </div>
          <div className="text-xs text-blue-600 mt-1">Sales from appointments</div>
        </div>

        {/* Total Revenue */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm font-medium text-green-700 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-green-900">
            {formatCurrency(results.totalRevenue)}
          </div>
          <div className="text-xs text-green-600 mt-1">From estimated sales</div>
        </div>

        {/* ROI Percentage */}
        <div className={`rounded-lg p-4 border ${
          isPositiveROI 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            isPositiveROI ? 'text-green-700' : 'text-red-700'
          }`}>
            ROI
          </div>
          <div className={`text-2xl font-bold ${
            isPositiveROI ? 'text-green-900' : 'text-red-900'
          }`}>
            {formatPercentage(results.roi)}
          </div>
          <div className={`text-xs mt-1 ${
            isPositiveROI ? 'text-green-600' : 'text-red-600'
          }`}>
            Return on investment
          </div>
        </div>

        {/* Cost per Appointment */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-1">Cost per Appointment</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(results.costPerAppointment)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Ad spend ÷ appointments</div>
        </div>

        {/* Break-even Point */}
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm font-medium text-yellow-700 mb-1">Break-even Point</div>
          <div className="text-2xl font-bold text-yellow-900">
            {formatNumber(results.breakevenPoint, 1)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Sales needed to break even</div>
        </div>

        {/* Profit */}
        <div className={`rounded-lg p-4 border ${
          isProfitable 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`text-sm font-medium mb-1 ${
            isProfitable ? 'text-green-700' : 'text-red-700'
          }`}>
            Profit / Loss
          </div>
          <div className={`text-2xl font-bold ${
            isProfitable ? 'text-green-900' : 'text-red-900'
          }`}>
            {formatCurrency(results.profit)}
          </div>
          <div className={`text-xs mt-1 ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}>
            Revenue - Ad spend
          </div>
        </div>
      </div>
    </div>
  );
};

