import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarChart from '@/components/ui/BarChart';
import ApexCharts from 'apexcharts';

// Mock ApexCharts
jest.mock('apexcharts', () => {
  return jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
  }));
});

describe('BarChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Ensures test cleanup after each run
  });

  it('renders the chart title and subtitle', () => {
    render(<BarChart />);
    expect(screen.getByText('Reports & Datasets Generated Per Week')).toBeInTheDocument();
    expect(screen.getByText('Hover over me...')).toBeInTheDocument();
  });

  it('initializes ApexCharts with correct container', () => {
    const { container } = render(<BarChart />);
    const chartDiv = container.querySelector('#column-chart');
    expect(chartDiv).toBeInTheDocument();
  });

  it('creates and destroys chart instance on mount and unmount', () => {
    const { unmount } = render(<BarChart />);
    
    expect(ApexCharts).toHaveBeenCalled();
    const mockChartInstance = (ApexCharts as unknown as jest.Mock).mock.results[0].value;
    expect(mockChartInstance.render).toHaveBeenCalled();
    
    unmount();
    expect(mockChartInstance.destroy).toHaveBeenCalled();
  });

  it('initializes ApexCharts with correct options', () => {
    render(<BarChart />);
    
    const mockApexCharts = ApexCharts as unknown as jest.Mock;
    expect(mockApexCharts).toHaveBeenCalled();

    const options = mockApexCharts.mock.calls[0][1];

    expect(options.colors).toEqual(['#d76047', 'black']);
    expect(options.chart.type).toBe('bar');
    expect(options.chart.height).toBe('320px');
    expect(options.series).toHaveLength(2);
    expect(options.series[0].name).toBe('Reports');
    expect(options.series[1].name).toBe('Datasets');
  });

  it('applies correct styling to the container', () => {
    const { container } = render(<BarChart />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('max-w-sm', 'w-full', 'bg-secondary', 'rounded-lg', 'shadow-sm');
  });
});
