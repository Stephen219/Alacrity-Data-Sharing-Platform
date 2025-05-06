import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import DatasetsPage from "@/components/all_datasets/all_datasets";
import { fetchWithAuth } from '@/libs/auth';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/components/all_datasets/datasetCard', () => ({
  DatasetCard: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="dataset-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  ),
}));

const mockDatasets = [
  {
    dataset_id: '1',
    title: 'Test Dataset 1',
    contributor_name: 'John Doe',
    organization_name: 'Org1',
    description: 'A test dataset',
    tags: ['test', 'data'],
    category: 'Science',
    created_at: '2023-01-01T00:00:00Z',
    analysis_link: null,
    updated_at: '2023-01-02T00:00:00Z',
    size: '10MB',
    number_of_rows: 100,
    imageUrl: 'https://picsum.photos/300/200?random=1',
    price: 0,
    view_count: 50,
    darkMode: false,
    averageRating: 4.5,
    number_of_downloads: 10,
    has_access: true,
  },
  {
    dataset_id: '2',
    title: 'Test Dataset 2',
    contributor_name: 'Jane Doe',
    organization_name: 'Org2',
    description: 'Another test dataset',
    tags: ['test', 'sample'],
    category: 'Technology',
    created_at: '2023-02-01T00:00:00Z',
    analysis_link: null,
    updated_at: '2023-02-02T00:00:00Z',
    size: '20MB',
    number_of_rows: 200,
    imageUrl: 'https://picsum.photos/300/200?random=2',
    price: 5,
    view_count: 30,
    darkMode: false,
    averageRating: 3.0,
    number_of_downloads: 5,
    has_access: false,
  },
];

describe('DatasetsPage', () => {
  const mockPush = jest.fn();
  const mockSearchParams = new URLSearchParams();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (fetchWithAuth as jest.Mock).mockReset();
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<DatasetsPage />);
    expect(screen.getByText('Loading datasets...')).toBeInTheDocument();
  });

  it('displays datasets after successful fetch', async () => {
    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: mockDatasets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 4.5 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 3.0 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    await act(async () => {
      render(<DatasetsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument();
    });
  });

  it('displays error message on fetch failure', async () => {
    (fetchWithAuth as jest.Mock)
      .mockRejectedValueOnce(new Error('Fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    await act(async () => {
      render(<DatasetsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error fetching datasets: Fetch failed/)).toBeInTheDocument();
    });
  });

  it('filters datasets based on search query', async () => {
    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: mockDatasets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 4.5 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 3.0 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    await act(async () => {
      render(<DatasetsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search datasets...'), {
      target: { value: 'Test Dataset 2' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Test Dataset 1')).not.toBeInTheDocument();
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument();
    });
  });

 

  it('navigates to dataset detail on click', async () => {
    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: mockDatasets }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 4.5 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ rating: 3.0 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    await act(async () => {
      render(<DatasetsPage />);
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Test Dataset 1'));
      expect(mockPush).toHaveBeenCalledWith('/requests/detail/1');
    });
  });

  it('handles pagination correctly', async () => {
    const manyDatasets = Array.from({ length: 10 }, (_, i) => ({
      ...mockDatasets[0],
      dataset_id: `${i + 1}`,
      title: `Test Dataset ${i + 1}`,
    }));

    (fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ datasets: manyDatasets }),
      })
      .mockResolvedValue({
        ok: true,
        json: async () => [{ rating: 4.5 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ role: 'user' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

    await act(async () => {
      render(<DatasetsPage />);
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('dataset-card').length).toBe(6); // ITEMS_PER_PAGE
    });

    const nextButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg path[d*="M9 5l7"]'));
    fireEvent.click(nextButton!);

    await waitFor(() => {
      expect(screen.getAllByTestId('dataset-card').length).toBe(4); // Remaining datasets
    });
  });
});