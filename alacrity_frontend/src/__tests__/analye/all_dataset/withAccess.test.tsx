import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatasetAccessed from "@/components/all_datasets/withAccess";
import { fetchWithAuth } from '@/libs/auth';


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));


jest.mock('next/link', () => {
  const MockLink: React.FC<{ children: React.ReactNode; href: string }> = ({ children, href }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('DatasetAccessed Component', () => {
  const mockDatasets = [
    {
      dataset_id: '1',
      title: 'Test Dataset 1',
      description: 'Test Description 1',
      organization: 'Test Org 1',
      updated_at: '2024-01-01T00:00:00Z',
      tags: 'tag1, tag2',
      category: 'Test Category',
      entries: 100,
      size: '1MB',
      isBookmarked: false,
      price: 0,
      view_count: 50,
    },
    {
      dataset_id: '2',
      title: 'Test Dataset 2',
      description: 'Test Description 2',
      organization: 'Test Org 2',
      updated_at: '2024-02-01T00:00:00Z',
      tags: 'tag3, tag4',
      category: 'Another Category',
      entries: 200,
      size: '2MB',
      isBookmarked: true,
      price: 10,
      view_count: 75,
    },
  ];

  beforeEach(() => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDatasets),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially and then displays datasets', async () => {
    render(<DatasetAccessed />);
    
    // Check initial render
    expect(screen.getByText('All Datasets you have access to')).toBeInTheDocument();

    // Wait for datasets to load
    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Test Dataset 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Showing 2 of 2 datasets')).toBeInTheDocument();
  });

  it('filters datasets based on search query', async () => {
    render(<DatasetAccessed />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'Test Dataset 1' } });

    expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Dataset 2')).not.toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 2 datasets')).toBeInTheDocument();
  });



  it('sorts datasets by title', async () => {
    render(<DatasetAccessed />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
    });

    // Open sort dropdown
    fireEvent.click(screen.getByText(/Sort:/));
    
    // Click title sort
    fireEvent.click(screen.getByText('Title'));
    
    // Check if datasets are sorted alphabetically
    const datasetElements = screen.getAllByRole('link');
    expect(datasetElements[0]).toHaveTextContent('Test Dataset 1');
    expect(datasetElements[1]).toHaveTextContent('Test Dataset 2');
  });

  it('toggles dark mode', async () => {
    render(<DatasetAccessed />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Dataset 1')).toBeInTheDocument();
    });

    const darkModeToggle = screen.getByLabelText('Switch to dark mode');
    expect(darkModeToggle).toBeInTheDocument();

    fireEvent.click(darkModeToggle);
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
  });

  it('handles empty dataset case', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<DatasetAccessed />);
    
    await waitFor(() => {
      expect(screen.getByText('No datasets found matching your search criteria.')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Showing 0 of 0 datasets')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<DatasetAccessed />);
    
    await waitFor(() => {
      expect(screen.getByText('Showing 0 of 0 datasets')).toBeInTheDocument();
    });
    
    expect(screen.getByText('No datasets found matching your search criteria.')).toBeInTheDocument();
  });
});