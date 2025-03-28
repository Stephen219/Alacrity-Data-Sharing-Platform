import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DatasetsPage from '@/app/organisation/admin/datasets/page';
import { fetchWithAuth } from '@/libs/auth';


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));


jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <div data-href={href}>{children}</div>;
  };
});

// Mock UI components
jest.mock('@/components/ui/input', () => ({
  Input: (props: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLInputElement> & React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} data-testid="search-input" />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: (props: React.JSX.IntrinsicAttributes & React.ClassAttributes<HTMLButtonElement> & React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}));

const mockUserData = {
  organization_id: 'org123',
  name: 'Test User',
};

const mockDatasetsData = {
  datasets: [
    {
      dataset_id: 'dataset1',
      title: 'First Dataset',
      description: 'A test dataset',
      category: 'category1',
      tags: ['tag1', 'tag2'],
      created_at: new Date().toISOString(),
      organization_name: 'Test Org',
      view_count: 10,
      schema: { field1: 'string' },
      price: '19.99',
      hasPaid: false,
    },
    {
      dataset_id: 'dataset2',
      title: 'Second Dataset',
      description: 'Another test dataset',
      category: 'category2',
      tags: ['tag3', 'tag4'],
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day earlier
      organization_name: 'Test Org',
      view_count: 5,
      schema: { field1: 'number' },
      price: '29.99',
      hasPaid: true,
    },
  ],
};

describe('DatasetsPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/users/profile/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });
      }
      if (url.includes('/datasets/all/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasetsData),
        });
      }
    });
  });

  test('renders loading state initially', async () => {
    render(<DatasetsPage />);
    expect(screen.getByText(/Loading datasets.../i)).toBeInTheDocument();
  });

  test('renders datasets after loading', async () => {
    render(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Organization Datasets')).toBeInTheDocument();
      expect(screen.getByText('First Dataset')).toBeInTheDocument();
      expect(screen.getByText('Second Dataset')).toBeInTheDocument();
    });
  });

  test('shows correct number of datasets', async () => {
    render(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 of 2 datasets')).toBeInTheDocument();
    });
  });

  test('search functionality works', async () => {
    render(<DatasetsPage />);

    await waitFor(() => {
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'First' } });
    });

    await waitFor(() => {
      expect(screen.getByText('First Dataset')).toBeInTheDocument();
      expect(screen.queryByText('Second Dataset')).not.toBeInTheDocument();
      expect(screen.getByText('Showing 1 of 2 datasets')).toBeInTheDocument();
    });
  });


  test('handles empty datasets scenario', async () => {
    (fetchWithAuth as jest.Mock).mockImplementationOnce((url) => {
      if (url.includes('/datasets/all/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ datasets: [] }),
        });
      }
    });

    render(<DatasetsPage />);

    await waitFor(() => {
      expect(screen.getByText('No datasets found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search or filters')).toBeInTheDocument();
    });
  });

  test('error handling for user fetch', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    (fetchWithAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Fetch failed');
    });

    render(<DatasetsPage />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });
});