/**
 * ROI Calculation Utilities
 * Functions to calculate ROI metrics from input parameters
 */

export interface ROIInputs {
  adSpend: number;
  appointments: number;
  showSaleRate: number; // Percentage (0-100)
  avgRevenuePerSale: number;
}

export interface ROIResults {
  estimatedSales: number;
  totalRevenue: number;
  costPerAppointment: number;
  roi: number; // Percentage
  breakevenPoint: number; // Number of sales needed
  profit: number;
}

/**
 * Calculate ROI metrics from input parameters
 */
export function calculateROI(inputs: ROIInputs): ROIResults {
  const { adSpend, appointments, showSaleRate, avgRevenuePerSale } = inputs;

  // Convert showSaleRate from percentage to decimal
  const saleRateDecimal = showSaleRate / 100;

  // Calculate estimated sales
  const estimatedSales = appointments * saleRateDecimal;

  // Calculate total revenue
  const totalRevenue = estimatedSales * avgRevenuePerSale;

  // Calculate cost per appointment
  const costPerAppointment = appointments > 0 ? adSpend / appointments : 0;

  // Calculate ROI percentage
  const roi = adSpend > 0 ? ((totalRevenue - adSpend) / adSpend) * 100 : 0;

  // Calculate break-even point (number of sales needed to cover ad spend)
  const breakevenPoint = avgRevenuePerSale > 0 ? adSpend / avgRevenuePerSale : 0;

  // Calculate profit
  const profit = totalRevenue - adSpend;

  return {
    estimatedSales: Math.round(estimatedSales * 100) / 100, // Round to 2 decimal places
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    costPerAppointment: Math.round(costPerAppointment * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    breakevenPoint: Math.round(breakevenPoint * 100) / 100,
    profit: Math.round(profit * 100) / 100,
  };
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format percentage value
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

