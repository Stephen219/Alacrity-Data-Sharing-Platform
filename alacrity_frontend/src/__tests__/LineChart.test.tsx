import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import LineChart from '@/components/ui/LineChart';
import ApexCharts from 'apexcharts';

//mock apex charts
jest.mock('apexcharts', () => {
  const mApexChart = { render: jest.fn(), destroy: jest.fn() };
  return jest.fn(() => mApexChart);
});

const mockApiResponse = {
  months: ["Mar","Apr","May","Jun","Jul","Aug"],
  organizations: [10,20,30,40,50,60],
  researchers: [5,5,5,5,5,5],
};

describe('LineChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve(mockApiResponse) })
    );
  });
  

  afterEach(cleanup);

  it('renders default title and subtitle', () => {
    render(<LineChart />);
    expect(screen.getByText('Monthly Users')).toBeInTheDocument();
    expect(screen.getByText('Hover over me...')).toBeInTheDocument();
  });

  it('renders correct container element', () => {
    const { container } = render(<LineChart />);
    expect(container.querySelector('#column-chart')).toBeInTheDocument();
  });

  it('creates and destroys ApexCharts instance on mount/unmount', () => {
    const { unmount } = render(<LineChart />);
    expect(ApexCharts).toHaveBeenCalled();
    const chartInstance = (ApexCharts as unknown as jest.Mock).mock.results[0].value;
    expect(chartInstance.render).toHaveBeenCalled();
    unmount();
    expect(chartInstance.destroy).toHaveBeenCalled();
  });

  it('initializes ApexCharts with correct default options', () => {
    render(<LineChart />);
    const mock = ApexCharts as unknown as jest.Mock;
    const options = mock.mock.calls[0][1];

    expect(options.series).toHaveLength(2);
    expect(options.series[0]).toEqual({
      name: 'Organisations',
      data: [1500,1418,1456,1526,1356,1256],
      color: '#d76047'
    });
    expect(options.series[1]).toEqual({
      name: 'Researchers & Contributors',
      data: [643,413,765,412,1423,1731],
      color: '#f5bd1f'
    });
    expect(options.xaxis.categories).toEqual([
      '01 February','02 February','03 February','04 February','05 February','06 February','07 February'
    ]);
  });

  it('applies correct styling classes', () => {
    const { container } = render(<LineChart />);
    expect(container.firstChild).toHaveClass('max-w-sm','w-full','bg-secondary','rounded-lg','shadow-sm');
  });

  it('fetches real data on hover and displays computed total sum', async () => {
    render(<LineChart />);
    const wrapper = screen.getByText(/Monthly users/i).closest('div')!;
    fireEvent.mouseEnter(wrapper);

    await waitFor(() => {
      expect(screen.getByText(/240/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  
});
