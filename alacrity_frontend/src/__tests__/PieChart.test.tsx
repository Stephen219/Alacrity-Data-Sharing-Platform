import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import PieChart from '@/components/ui/PieChart';
import ApexCharts from 'apexcharts';

// Mock ApexCharts
jest.mock('apexcharts', () => {
  return jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
  }));
});

describe('PieChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Cleanup after each test
  });

  it('renders the chart title and subtitle', () => {
    render(<PieChart />);
    expect(screen.getByText('Approval Statistics')).toBeInTheDocument();
    expect(screen.getByText('Per 100 requests')).toBeInTheDocument();
  });

  it('renders statistics cards with correct values', () => {
    render(<PieChart />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('Denied')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('initializes ApexCharts with correct container', () => {
    const { container } = render(<PieChart />);
    const chartDiv = container.querySelector('#radial-chart');
    expect(chartDiv).toBeInTheDocument();
  });

  it('creates and destroys chart instance on mount and unmount', () => {
    const { unmount } = render(<PieChart />);
    
    expect(ApexCharts).toHaveBeenCalled();
    const mockChartInstance = (ApexCharts as unknown as jest.Mock).mock.results[0].value;
    expect(mockChartInstance.render).toHaveBeenCalled();
    
    unmount();
    expect(mockChartInstance.destroy).toHaveBeenCalled();
  });

  it('initializes ApexCharts with correct options', () => {
    render(<PieChart />);
    
    const mockApexCharts = ApexCharts as unknown as jest.Mock;
    expect(mockApexCharts).toHaveBeenCalled();

    const options = mockApexCharts.mock.calls[0][1];
    
    // Test series data
    expect(options.series).toEqual([90, 85, 70]);
    expect(options.colors).toEqual(['#d63741', '#e5803b', '#f5bd1f']);
    
    // Test chart configuration
    expect(options.chart.type).toBe('radialBar');
    expect(options.chart.height).toBe('350px');
    expect(options.chart.width).toBe('100%');
    
    // Test radialBar specific options
    expect(options.plotOptions.radialBar.track.background).toBe('#E5E7EB');
    expect(options.plotOptions.radialBar.dataLabels.show).toBe(false);
    expect(options.plotOptions.radialBar.hollow.size).toBe('32%');
    
    // Test labels
    expect(options.labels).toEqual(['Approved', 'Pending', 'Denied']);
  });

  it('applies correct styling to the container', () => {
    const { container } = render(<PieChart />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      'max-w-sm',
      'w-full',
      'bg-secondary',
      'rounded-lg',
      'shadow-sm'
    );
  });

  it('renders the statistics grid with correct classes', () => {
    const { container } = render(<PieChart />);
    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('grid-cols-3', 'gap-3');
  });
});
