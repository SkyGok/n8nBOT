/**
 * ROI Analysis Page Component
 * Displays ROI calculations and visualizations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ROIInputCard } from '@/components/ROI/ROIInputCard';
import { ROIResultCard } from '@/components/ROI/ROIResultCard';
import { ROIChart } from '@/components/ROI/ROIChart';
import { DateRangePicker } from '@/components/ROI/DateRangePicker';
import { calculateROI, ROIInputs, ROIResults } from '@/utils/roiCalculations';
import { fetchAppointmentCount } from '@/services/roiService';

export const ROIAnalysis: React.FC = () => {
  // Input state
  const [adSpend, setAdSpend] = useState<number>(0);
  const [appointments, setAppointments] = useState<number>(0);
  const [showSaleRate, setShowSaleRate] = useState<number>(20); // Default 20%
  const [avgRevenuePerSale, setAvgRevenuePerSale] = useState<number>(0);

  // Date range state
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Loading state
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);

  // Fetch appointments from Supabase on mount and when date range changes
  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoadingAppointments(true);
      try {
        // For demo: No user_id filtering - get all appointments
        const count = await fetchAppointmentCount({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          // userId removed for demo purposes
        });
        setAppointments(count);
      } catch (error) {
        console.error('[ROI Analysis] Error loading appointments:', error);
        // Keep current appointments value on error
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    loadAppointments();
  }, [startDate, endDate]);

  // Calculate ROI results whenever inputs change
  const roiResults = useMemo<ROIResults | null>(() => {
    if (adSpend === 0 && appointments === 0 && avgRevenuePerSale === 0) {
      return null;
    }

    const inputs: ROIInputs = {
      adSpend,
      appointments,
      showSaleRate,
      avgRevenuePerSale,
    };

    return calculateROI(inputs);
  }, [adSpend, appointments, showSaleRate, avgRevenuePerSale]);

  const handleClearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          ROI Analysis
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Calculate and visualize return on investment for your marketing campaigns
        </p>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onClear={handleClearDates}
      />

      {/* ROI Input Form */}
      <ROIInputCard
        adSpend={adSpend}
        appointments={appointments}
        showSaleRate={showSaleRate}
        avgRevenuePerSale={avgRevenuePerSale}
        onAdSpendChange={setAdSpend}
        onAppointmentsChange={setAppointments}
        onShowSaleRateChange={setShowSaleRate}
        onAvgRevenuePerSaleChange={setAvgRevenuePerSale}
        isLoadingAppointments={isLoadingAppointments}
      />

      {/* ROI Results */}
      {roiResults && (
        <>
          <ROIResultCard results={roiResults} isLoading={false} />

          {/* ROI Chart */}
          <ROIChart
            data={{
              adSpend,
              totalRevenue: roiResults.totalRevenue,
              profit: roiResults.profit,
            }}
            isLoading={false}
          />
        </>
      )}

      {/* Empty State */}
      {!roiResults && (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Enter values to calculate ROI
          </h3>
          <p className="text-sm text-gray-600">
            Fill in the input fields above to see your ROI calculations and visualizations
          </p>
        </div>
      )}
    </div>
  );
};

