import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatasetDetailPage from '@/components/all_datasets/dataset_detail';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';
import * as auth from '@/libs/auth';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

const mockPush = jest.fn();

describe('DatasetDetailPage', () => {
  const datasetMock = {
    dataset_id: '123',
    title: 'Test Dataset',
    description: 'This is a test dataset description.',
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders loader while fetching data', () => {
    (auth.fetchWithAuth as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolves

    render(<DatasetDetailPage params={{ dataset_id: '123' }} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders dataset details after fetching', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => datasetMock,
    });

    render(<DatasetDetailPage params={{ dataset_id: '123' }} />);

    expect(await screen.findByText(datasetMock.title)).toBeInTheDocument();
    expect(screen.getByText(datasetMock.description)).toBeInTheDocument();
  });

  it('displays error if fetch fails', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

    render(<DatasetDetailPage params={{ dataset_id: '123' }} />);

    expect(await screen.findByText(/Unable to load dataset details/i)).toBeInTheDocument();
  });

  it('allows submitting a review with rating and comment', async () => {
    (auth.fetchWithAuth as jest.Mock).mockImplementation((url) => {
      if (url.includes('/datasets/123/')) {
        return Promise.resolve({ ok: true, json: async () => datasetMock });
      }
      if (url.includes('/datasets/feedback/')) {
        return Promise.resolve({ ok: true, json: async () => ({ message: 'Feedback submitted successfully!' }) });
      }
    });

    render(<DatasetDetailPage params={{ dataset_id: '123' }} />);
    await waitFor(() => expect(screen.getByText(datasetMock.title)).toBeInTheDocument());

    // Rate 4 stars
    const stars = screen.getAllByTestId('lucide-star');
    fireEvent.click(stars[3]); // Click the 4th star (index 3 = 4th star)

    // Enter comment
    const textarea = screen.getByPlaceholderText(/write your review here/i);
    fireEvent.change(textarea, { target: { value: 'Great dataset!' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);

    // Wait for feedback success message
    await waitFor(() => {
      expect(screen.getByText(/feedback submitted successfully/i)).toBeInTheDocument();
    });

    // Check if comment appears
    expect(screen.getByText('Great dataset!')).toBeInTheDocument();
  });
  it('navigates back to dataset list on error page button click', async () => {
    (auth.fetchWithAuth as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

    render(<DatasetDetailPage params={{ dataset_id: '123' }} />);

    expect(await screen.findByText(/unable to load dataset details/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to datasets/i }));
    expect(mockPush).toHaveBeenCalledWith('/researcher/datasetWithAccess');
  });
});