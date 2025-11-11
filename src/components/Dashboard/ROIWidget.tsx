/**
 * ROI Calculator Widget
 * Simple calculator allowing input of spend and results to compute ROI
 */

import React, { useMemo, useState } from 'react';

export const ROIWidget: React.FC = () => {
  const [adSpend, setAdSpend] = useState<number>(500);
  const [appointments, setAppointments] = useState<number>(30);
  const [showRate, setShowRate] = useState<number>(0.6); // show->sale rate
  const [avgRevenue, setAvgRevenue] = useState<number>(150); // revenue per sale

  const { totalRevenue, costPerAppointment, estimatedSales, roiPercent } = useMemo(() => {
    const estimatedSalesLocal = Math.round(appointments * showRate);
    const totalRevenueLocal = estimatedSalesLocal * avgRevenue;
    const costPerAppointmentLocal = appointments > 0 ? adSpend / appointments : 0;
    const roiPercentLocal = adSpend > 0 ? ((totalRevenueLocal - adSpend) / adSpend) * 100 : 0;
    return {
      totalRevenue: totalRevenueLocal,
      costPerAppointment: costPerAppointmentLocal,
      estimatedSales: estimatedSalesLocal,
      roiPercent: roiPercentLocal,
    };
  }, [adSpend, appointments, showRate, avgRevenue]);

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">ROI Calculator</h2>
          <p className="text-sm text-gray-500">Estimate return based on appointments and revenue</p>
        </div>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="ROI calculator form">
        <label className="flex flex-col text-sm text-gray-700">
          Ad Spend ($)
          <input
            type="number"
            value={adSpend}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            className="mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min={0}
            aria-label="Ad spend input"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Appointments
          <input
            type="number"
            value={appointments}
            onChange={(e) => setAppointments(Number(e.target.value))}
            className="mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min={0}
            aria-label="Appointments input"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Show→Sale Rate
          <input
            type="number"
            step="0.05"
            value={showRate}
            onChange={(e) => setShowRate(Number(e.target.value))}
            className="mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min={0}
            max={1}
            aria-label="Show to sale rate input"
          />
          <span className="text-xs text-gray-500 mt-1">0 to 1 (e.g. 0.6 = 60%)</span>
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Avg Revenue per Sale ($)
          <input
            type="number"
            value={avgRevenue}
            onChange={(e) => setAvgRevenue(Number(e.target.value))}
            className="mt-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            min={0}
            aria-label="Average revenue per sale input"
          />
        </label>
      </form>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Estimated Sales</p>
          <p className="text-2xl font-semibold text-gray-900">{estimatedSales}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Cost / Appointment</p>
          <p className="text-2xl font-semibold text-gray-900">${costPerAppointment.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">ROI</p>
          <p className={`text-2xl font-semibold ${roiPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {roiPercent.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        Estimated sales {estimatedSales}, total revenue {totalRevenue}, cost per appointment {costPerAppointment}, ROI {roiPercent}%.
      </div>
    </div>
  );
}


