import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardLayout from '@/components/Charts';

jest.mock('@/components/ui/PieChart', () => {
  return function MockPieChart() {
    return <div data-testid="pie-chart">Mock Pie Chart</div>;
  };
});

jest.mock('@/components/ui/BarChart', () => {
  return function MockBarChart() {
    return <div data-testid="bar-chart">Mock Bar Chart</div>;
  };
});

jest.mock('@/components/ui/LineChart', () => {
  return function MockLineChart() {
    return <div data-testid="line-chart">Mock Line Chart</div>;
  };
});

describe('DashboardLayout', () => {
  it('renders all three charts', () => {
    const { getByTestId } = render(<DashboardLayout />);
    
    expect(getByTestId('pie-chart')).toBeInTheDocument();
    expect(getByTestId('bar-chart')).toBeInTheDocument();
    expect(getByTestId('line-chart')).toBeInTheDocument();
  });

  it('applies correct grid layout classes', () => {
    const { container } = render(<DashboardLayout />);
    const gridContainer = container.firstChild as HTMLElement;
    
    expect(gridContainer).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3',
      'gap-4'
    );
  });

  it('maintains correct order of charts', () => {
    const { container } = render(<DashboardLayout />);
    const charts = container.querySelectorAll('[data-testid]');
    
    expect(charts[0]).toHaveAttribute('data-testid', 'pie-chart');
    expect(charts[1]).toHaveAttribute('data-testid', 'bar-chart');
    expect(charts[2]).toHaveAttribute('data-testid', 'line-chart');
  });

  it('renders the break element', () => {
    const { container } = render(<DashboardLayout />);
    const breakElement = container.querySelector('br');
    expect(breakElement).toBeInTheDocument();
  });
});