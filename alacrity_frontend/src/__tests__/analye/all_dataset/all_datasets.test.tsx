import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'next-themes';
import DatasetsPage from '@/components/all_datasets/all_datasets';
import { fetchWithAuth } from '@/libs/auth';
import '@testing-library/jest-dom';


jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});


beforeEach(() => {
    jest.clearAllMocks();
  
    
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: false, 
      media: query,
      onchange: null,
      addListener: jest.fn(), 
      removeListener: jest.fn(), 
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  
 
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/datasets/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets),
        });
      } else if (url.includes('/datasets/bookmarks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookmarks),
        });
      } else if (url.includes('/bookmark')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));


jest.mock('@/config', () => ({
  BACKEND_URL: 'http://test-api.example.com',
}));


jest.mock('@/components/all_datasets/datasetCard', () => ({
  DatasetCard: ({ 
    title, 
    description, 
    onToggleBookmark,
    isBookmarked 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) => (
    <div data-testid="dataset-card">
      <h3>{title}</h3>
      <p>{description}</p>
      <button 
        data-testid="bookmark-button"
        onClick={(e) => {
          e.preventDefault();
          onToggleBookmark();
        }}
      >
        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>
    </div>
  ),
}));

const mockDatasets = {
  datasets: [
    {
      dataset_id: '1',
      title: 'Dataset 1',
      description: 'Description for dataset 1',
      contributor_name: 'Contributor 1',
      organization_name: 'Organization 1',
      category: 'Category 1',
      created_at: '2024-03-01T00:00:00.000Z',
      updated_at: '2024-03-01T00:00:00.000Z',
      tags: ['tag1', 'tag2'],
      analysis_link: null,
      price: 0,
      view_count: 10,
    },
    {
      dataset_id: '2',
      title: 'Dataset 2',
      description: 'Description for dataset 2',
      contributor_name: 'Contributor 2',
      organization_name: 'Organization 2',
      category: 'Category 2',
      created_at: '2024-03-15T00:00:00.000Z',
      updated_at: '2024-03-15T00:00:00.000Z',
      tags: ['tag2', 'tag3'],
      analysis_link: null,
      price: 9.99,
      view_count: 20,
    },
  ],
};

const mockBookmarks = [
  { dataset_id: '1' }
];

const renderWithTheme = (component: React.ReactNode) => {
  return render(
    <ThemeProvider attribute="class">
      {component}
    </ThemeProvider>
  );
};

describe('DatasetsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock responses
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/datasets/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDatasets),
        });
      } else if (url.includes('/datasets/bookmarks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBookmarks),
        });
      } else if (url.includes('/bookmark')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  test('renders loading state initially', () => {
    renderWithTheme(<DatasetsPage />);
    expect(screen.getByText('Loading datasets...')).toBeInTheDocument();
  });

  test('renders datasets after loading', async () => {
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('Explore Datasets')).toBeInTheDocument();
    expect(screen.getAllByTestId('dataset-card')).toHaveLength(2);
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.getByText('Dataset 2')).toBeInTheDocument();
  });

  test('handles search filtering correctly', async () => {
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'Dataset 1' } });
    
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.queryByText('Dataset 2')).not.toBeInTheDocument();
  });

  test('toggles between grid and list view', async () => {
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    const listViewButton = screen.getByLabelText('List view');
    fireEvent.click(listViewButton);
    
    // Check that the container has the right classes for list view
    // We can't directly test the class changes, but we can test that the button is active
    expect(listViewButton).toHaveClass('bg-orange-500');
    
    const gridViewButton = screen.getByLabelText('Grid view');
    fireEvent.click(gridViewButton);
    
    expect(gridViewButton).toHaveClass('bg-orange-500');
  });

  test('correctly displays and interacts with filter categories', async () => {
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    // Click on the Category filter button
    const categoryFilterButton = screen.getByText('Category');
    fireEvent.click(categoryFilterButton);
    
    // Check that filter options are displayed
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
    
    // Select a filter option
    fireEvent.click(screen.getByText('Category 1'));
    
    // Check that the filter is applied and displayed
    expect(screen.getByText('Category: Category 1')).toBeInTheDocument();
    
    // Only Dataset 1 should be visible
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.queryByText('Dataset 2')).not.toBeInTheDocument();
    
    // Remove the filter
    const removeFilterButton = screen.getByLabelText('Remove Category 1 from category filter');
    fireEvent.click(removeFilterButton);
    
    // Both datasets should be visible again
    await waitFor(() => {
      expect(screen.getByText('Dataset 1')).toBeInTheDocument();
      expect(screen.getByText('Dataset 2')).toBeInTheDocument();
    });
  });

  test('toggles dataset bookmark correctly', async () => {
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    // Dataset 1 should be initially bookmarked
    const bookmarkButtons = screen.getAllByTestId('bookmark-button');
    expect(bookmarkButtons[0]).toHaveTextContent('Bookmarked');
    expect(bookmarkButtons[1]).toHaveTextContent('Bookmark');
    
    // Toggle the bookmark for Dataset 1
    fireEvent.click(bookmarkButtons[0]);
    
    // Verify the API was called correctly
    expect(fetchWithAuth).toHaveBeenCalledWith(
      'http://test-api.example.com/datasets/1/bookmark/',
      { method: 'POST' }
    );
    
    // The UI should update immediately (optimistic update)
    expect(bookmarkButtons[0]).toHaveTextContent('Bookmark');
    
    // Toggle bookmark for Dataset 2
    fireEvent.click(bookmarkButtons[1]);
    
    expect(fetchWithAuth).toHaveBeenCalledWith(
      'http://test-api.example.com/datasets/2/bookmark/',
      { method: 'POST' }
    );
    
    expect(bookmarkButtons[1]).toHaveTextContent('Bookmarked');
  });

  test('handles pagination correctly', async () => {
    // Mock a larger dataset to test pagination
    const manyDatasets = {
      datasets: Array.from({ length: 10 }, (_, i) => ({
        dataset_id: `${i + 1}`,
        title: `Dataset ${i + 1}`,
        description: `Description for dataset ${i + 1}`,
        contributor_name: `Contributor ${i + 1}`,
        organization_name: `Organization ${i % 3 + 1}`,
        category: `Category ${i % 2 + 1}`,
        created_at: '2024-03-01T00:00:00.000Z',
        updated_at: '2024-03-01T00:00:00.000Z',
        tags: [`tag${i % 3 + 1}`, `tag${i % 4 + 1}`],
        analysis_link: null,
        price: i % 2 === 0 ? 0 : 9.99,
        view_count: 10 * (i + 1),
      })),
    };
    
    (fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/datasets/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(manyDatasets),
        });
      } else if (url.includes('/datasets/bookmarks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ dataset_id: '1' }]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
    
    renderWithTheme(<DatasetsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading datasets...')).not.toBeInTheDocument();
    });
    
    // We should see the first 6 datasets (ITEMS_PER_PAGE)
    expect(screen.getByText('Dataset 1')).toBeInTheDocument();
    expect(screen.getByText('Dataset 6')).toBeInTheDocument();
    expect(screen.queryByText('Dataset 7')).not.toBeInTheDocument();
    
    // Click on page 2
    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);
    
    // Now we should see datasets 7-10
    expect(screen.queryByText('Dataset 1')).not.toBeInTheDocument();
    expect(screen.getByText('Dataset 7')).toBeInTheDocument();
    expect(screen.getByText('Dataset 10')).toBeInTheDocument();
  });

  

  
});