/**
 * Unit test example for SummaryCards component
 * Demonstrates testing React components with Vitest and Testing Library
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SummaryCards } from './SummaryCards';
import { useSummaryStats } from '@/hooks/useDashboardData';

// Mock the hook
vi.mock('@/hooks/useDashboardData', () => ({
  useSummaryStats: vi.fn(),
}));

describe('SummaryCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state', () => {
    (useSummaryStats as ReturnType<typeof vi.fn>).mockReturnValue({
      summaryStats: null,
      isLoadingSummary: true,
      summaryError: null,
    });

    render(<SummaryCards />);
    expect(screen.getAllByRole('generic').some(el => el.className.includes('animate-pulse'))).toBeTruthy();
  });

  it('displays error state', () => {
    (useSummaryStats as ReturnType<typeof vi.fn>).mockReturnValue({
      summaryStats: null,
      isLoadingSummary: false,
      summaryError: 'Failed to load data',
    });

    render(<SummaryCards />);
    expect(screen.getByText(/error loading summary statistics/i)).toBeInTheDocument();
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('displays summary statistics when loaded', async () => {
    (useSummaryStats as ReturnType<typeof vi.fn>).mockReturnValue({
      summaryStats: {
        totalCalls: 100,
        answeredCalls: 75,
        missedCalls: 25,
        averageDuration: 180,
        totalDuration: 18000,
        lastUpdated: new Date().toISOString(),
      },
      isLoadingSummary: false,
      summaryError: null,
    });

    render(<SummaryCards />);
    
    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });
});

