/**
 * ROI Input Card Component
 * Form for inputting ROI calculation parameters
 */

import React from 'react';

export interface ROIInputCardProps {
  adSpend: number;
  appointments: number;
  showSaleRate: number;
  avgRevenuePerSale: number;
  onAdSpendChange: (value: number) => void;
  onAppointmentsChange: (value: number) => void;
  onShowSaleRateChange: (value: number) => void;
  onAvgRevenuePerSaleChange: (value: number) => void;
  isLoadingAppointments?: boolean;
}

export const ROIInputCard: React.FC<ROIInputCardProps> = ({
  adSpend,
  appointments,
  showSaleRate,
  avgRevenuePerSale,
  onAdSpendChange,
  onAppointmentsChange,
  onShowSaleRateChange,
  onAvgRevenuePerSaleChange,
  isLoadingAppointments = false,
}) => {
  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">ROI Input Parameters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Ad Spend */}
        <div>
          <label htmlFor="adSpend" className="block text-sm font-medium text-gray-700 mb-2">
            Ad Spend ($)
          </label>
          <input
            id="adSpend"
            type="number"
            min="0"
            step="0.01"
            value={adSpend || ''}
            onChange={(e) => onAdSpendChange(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0.00"
          />
        </div>

        {/* Appointments */}
        <div>
          <label htmlFor="appointments" className="block text-sm font-medium text-gray-700 mb-2">
            Appointments
            {isLoadingAppointments && (
              <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
            )}
          </label>
          <input
            id="appointments"
            type="number"
            min="0"
            step="1"
            value={appointments || ''}
            onChange={(e) => onAppointmentsChange(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
        </div>

        {/* Show → Sale Rate */}
        <div>
          <label htmlFor="showSaleRate" className="block text-sm font-medium text-gray-700 mb-2">
            Show → Sale Rate (%)
          </label>
          <div className="relative">
            <input
              id="showSaleRate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={showSaleRate || ''}
              onChange={(e) => onShowSaleRateChange(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="0.0"
            />
            <span className="absolute right-3 top-2.5 text-gray-500">%</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Percentage of appointments that result in a sale
          </p>
        </div>

        {/* Average Revenue per Sale */}
        <div>
          <label htmlFor="avgRevenuePerSale" className="block text-sm font-medium text-gray-700 mb-2">
            Average Revenue per Sale ($)
          </label>
          <input
            id="avgRevenuePerSale"
            type="number"
            min="0"
            step="0.01"
            value={avgRevenuePerSale || ''}
            onChange={(e) => onAvgRevenuePerSaleChange(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
};

