import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import LineChart from '@/components/ui/LineChart';
import ApexCharts from 'apexcharts';

// Mock ApexCharts to avoid real rendering in tests
jest.mock('apexcharts', () => {
  return jest.fn().mockImplementation(() => ({
    render: jest.fn(),
    destroy: jest.fn(),
  }));
});

describe('LineChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup(); // Ensures test cleanup after each run
  });

  it('renders the chart title and subtitle', () => {
    render(<LineChart />);
    expect(screen.getByText('31,735')).toBeInTheDocument();
    expect(screen.getByText('Monthly users')).toBeInTheDocument();
  });

  it('initializes ApexCharts with correct container', () => {
    const { container } = render(<LineChart />);
    const chartDiv = container.querySelector('#column-chart');
    expect(chartDiv).toBeInTheDocument();
  });

  it('creates and destroys chart instance on mount and unmount', () => {
    const { unmount } = render(<LineChart />);

    expect(ApexCharts).toHaveBeenCalled();

    // Fix type conversion by using `as jest.Mock`
    const mockChartInstance = (ApexCharts as unknown as jest.Mock).mock.results[0].value;
    expect(mockChartInstance.render).toHaveBeenCalled();

    unmount(); // Use unmount() instead of `screen.unmount`
    expect(mockChartInstance.destroy).toHaveBeenCalled();
  });

  it('initializes ApexCharts with correct options', () => {
    render(<LineChart />);
    
    const mockApexCharts = ApexCharts as unknown as jest.Mock;
    expect(mockApexCharts).toHaveBeenCalled();

    const options = mockApexCharts.mock.calls[0][1];

    expect(options.series).toHaveLength(2);
    expect(options.series[0]).toEqual({
      name: 'Organisations',
      data: [1500, 1418, 1456, 1526, 1356, 1256],
      color: '#d76047'
    });
    expect(options.series[1]).toEqual({
      name: 'Researchers',
      data: [643, 413, 765, 412, 1423, 1731],
      color: '#f5bd1f'
    });

    expect(options.chart.type).toBe('area');
    expect(options.chart.height).toBe(320);
    expect(options.chart.toolbar.show).toBe(false);
    
    expect(options.stroke.width).toBe(6);
    expect(options.grid.show).toBe(false);
    expect(options.dataLabels.enabled).toBe(false);
  });

  it('applies correct styling to the container', () => {
    const { container } = render(<LineChart />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass(
      'max-w-sm',
      'w-full',
      'bg-secondary',
      'rounded-lg',
      'shadow-sm'
    );
  });

  it('renders with correct date categories', () => {
    render(<LineChart />);
    
    const mockApexCharts = ApexCharts as unknown as jest.Mock;
    expect(mockApexCharts).toHaveBeenCalled();

    const options = mockApexCharts.mock.calls[0][1];

    expect(options.xaxis.categories).toEqual([
      '01 February',
      '02 February',
      '03 February',
      '04 February',
      '05 February',
      '06 February',
      '07 February'
    ]);
  });
});
