import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatasetDetail from '@/components/all_datasets/description'; // Adjust the path as needed
import { useRouter, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import * as auth from '@/libs/auth';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetchWithAuth
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

describe('DatasetDetail', () => {
  const mockRouter = { back: jest.fn(), push: jest.fn() };
  const mockSearchParams = new URLSearchParams();

  const datasetMock = {
    dataset_id: '123',
    title: 'Test Dataset',
    contributor_name: 'John Doe',
    organization_name: 'Test Org',
    category: 'Science',
    schema: 'test_schema',
    analysis_link: 'http://example.com',
    description: 'This is a test dataset.',
    tags: 'tag1, tag2',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  };

  const feedbackMock = [
    {
      user__username: 'user1',
      rating: 4,
      comment: 'Great dataset!',
      created_at: '2023-01-03T12:00:00Z',
    },
  ];

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("id=123"));
    jest.clearAllMocks();
  });

  it('displays error if no dataset ID is provided', () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams()); // No id

    render(<DatasetDetail />);
    expect(screen.getByText('No dataset ID provided.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to datasets/i })).toBeInTheDocument();
  });

  it('displays error if dataset fetch fails', async () => {
    mockSearchParams.set('id', '123');
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "Not found",
    });

    render(<DatasetDetail />);
    await waitFor(() => {
      expect(screen.getByText(/Error loading data: Failed to fetch dataset: 404/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to datasets/i })).toBeInTheDocument();
    });
  });

  it('renders dataset details and feedback after successful fetch', async () => {
    (auth.fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => datasetMock,
        text: async () => JSON.stringify(datasetMock),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => feedbackMock,
        text: async () => JSON.stringify(feedbackMock),
      });

    render(<DatasetDetail />);

    // Wait for the dataset title to appear
    await waitFor(() => {
      expect(screen.getByText(datasetMock.title)).toBeInTheDocument();
    });

    // Use userEvent to click the details toggle button.
    const detailsToggle = screen.getByTestId('details-toggle');
    await userEvent.click(detailsToggle);

    const tagsToggle = screen.getByTestId('tags-toggle');
    await userEvent.click(tagsToggle);

    // Wait for the organization name to appear after clicking toggle.
    const orgEl = await screen.findByText(/Test Org/i);
    expect(orgEl).toBeInTheDocument();

    expect(screen.getByText(datasetMock.description)).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText(feedbackMock[0].comment)).toBeInTheDocument();
    expect(screen.getByText(feedbackMock[0].user__username)).toBeInTheDocument();
  });
  

  it('submits a request successfully', async () => {
    mockSearchParams.set('id', '123');
    (auth.fetchWithAuth as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => datasetMock,
        text: async () => JSON.stringify(datasetMock),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        text: async () => "[]",
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Request created successfully!' }),
        text: async () => JSON.stringify({ message: 'Request created successfully!' }),
      });

    render(<DatasetDetail />);
    await waitFor(() => expect(screen.getByText(datasetMock.title)).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/Provide details on why you would like to access this dataset./i);
    fireEvent.change(textarea, { target: { value: 'For research purposes' } });

    const submitButton = screen.getByRole('button', { name: /submit request/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Request created successfully!')).toBeInTheDocument();
      expect(textarea).toHaveValue(''); // Textarea should be cleared
    });
  });

  // it('navigates back when back button is clicked', async () => {
  //   mockSearchParams.set('id', '123');
  //   (auth.fetchWithAuth as jest.Mock)
  //     .mockResolvedValueOnce({
  //       ok: true,
  //       json: async () => datasetMock,
  //       text: async () => JSON.stringify(datasetMock),
  //     })
  //     .mockResolvedValueOnce({
  //       ok: true,
  //       json: async () => [],
  //       text: async () => "[]",
  //     });

  //   render(<DatasetDetail />);
  //   await waitFor(() => expect(screen.getByText(datasetMock.title)).toBeInTheDocument());

  //   const backButton = screen.getByRole('button', { name: /back/i });
  //   fireEvent.click(backButton);

  //   expect(mockRouter.back).toHaveBeenCalled();
  // });

  it('navigates to datasets on error page back button click', async () => {
    mockSearchParams.set('id', '123');
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => "Server error",
    });

    render(<DatasetDetail />);
    await waitFor(() => expect(screen.getByText(/error loading data/i)).toBeInTheDocument());

    const backButton = screen.getByRole('button', { name: /back to datasets/i });
    fireEvent.click(backButton);

    expect(mockRouter.push).toHaveBeenCalledWith('/datasets');
  });
});