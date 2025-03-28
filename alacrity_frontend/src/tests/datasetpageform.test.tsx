
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import DatasetForm from '../components/dataForm';
import { fetchWithAuth } from '@/libs/auth';
import { BACKEND_URL } from '@/config';


// Mock fetchWithAuth
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock MaxWidthWrapper
jest.mock('../components/MaxWidthWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="max-width-wrapper">{children}</div>,
}));

// Mock UI components
jest.mock('../components/ui/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

jest.mock('../components/ui/Upload', () => ({
  __esModule: true,
  default: () => <div data-testid="upload-icon">Upload Icon</div>,
}));

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_API_KEY = 'test-google-api-key';
process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.NEXT_PUBLIC_DROPBOX_APP_KEY = 'test-dropbox-app-key';
process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID = 'test-onedrive-client-id';

// Mock global window object for cloud services
const mockGapiLoad = jest.fn((api, callback) => callback());
const mockGapiClientInit = jest.fn().mockResolvedValue({});
const mockRequestAccessToken = jest.fn((config) => {
  if (config.callback) config.callback({ access_token: 'mock-token' });
});
const mockInitTokenClient = jest.fn().mockReturnValue({
  requestAccessToken: mockRequestAccessToken,
});
const mockPickerSetCallback = jest.fn((callback) => {
  callback({ action: 'picked', docs: [{ id: 'mock-id', name: 'google_file.csv' }] });
  return { build: jest.fn().mockReturnValue({ setVisible: jest.fn() }) };
});
const mockDropboxChoose = jest.fn();
const mockOneDriveOpen = jest.fn();

beforeAll(() => {
  global.window = Object.create(window);
  Object.defineProperty(window, 'gapi', {
    value: {
      load: mockGapiLoad,
      client: {
        init: mockGapiClientInit,
        drive: {
          files: {
            get: jest.fn().mockResolvedValue({
              result: { webContentLink: 'https://drive.google.com/file.csv', name: 'google_file.csv' },
            }),
          },
        },
      },
    },
    writable: true,
  });

  Object.defineProperty(window, 'google', {
    value: {
      accounts: {
        oauth2: {
          initTokenClient: mockInitTokenClient,
        },
      },
      picker: {
        PickerBuilder: jest.fn(() => ({
          addView: jest.fn().mockReturnThis(),
          enableFeature: jest.fn().mockReturnThis(),
          setOAuthToken: jest.fn().mockReturnThis(),
          setDeveloperKey: jest.fn().mockReturnThis(),
          setCallback: mockPickerSetCallback,
          build: jest.fn().mockReturnValue({ setVisible: jest.fn() }),
        })),
        ViewId: { DOCS: 'docs', SPREADSHEETS: 'spreadsheets', PDFS: 'pdfs' },
        Feature: { NAV_HIDDEN: 'nav_hidden' },
        Action: { PICKED: 'picked' },
      },
    },
    writable: true,
  });

  Object.defineProperty(window, 'Dropbox', {
    value: { choose: mockDropboxChoose },
    writable: true,
  });

  Object.defineProperty(window, 'OneDrive', {
    value: { open: mockOneDriveOpen },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Utility to create a mock file
const createMockFile = (name = 'test.csv', size = 1024, type = 'text/csv') => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('DatasetForm Component', () => {
  test('renders the form correctly', () => {
    render(<DatasetForm />);
    expect(screen.getByText(/Add New Dataset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByText(/Select Dataset File/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Dataset/i)).toBeInTheDocument();
  });

  test('displays validation errors when submitting an empty form', async () => {
    render(<DatasetForm />);
    fireEvent.click(screen.getByText(/Upload Dataset/i));

    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one tag is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a file/i)).toBeInTheDocument();
      expect(screen.getByText(/You must agree to the license terms/i)).toBeInTheDocument();
      expect(screen.getByText(/Price is required/i)).toBeInTheDocument();
    });
  });

  test('fills out and submits the form successfully', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Dataset uploaded successfully!' }),
    });

    render(<DatasetForm />);
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Title/i), 'Test Dataset');
      await userEvent.type(screen.getByLabelText(/Description/i), 'This is a test dataset with a detailed description that exceeds the minimum requirement of 100 characters. It contains information about testing.');
      await userEvent.type(screen.getByLabelText(/Tags/i), 'test,dataset');
      await fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'category1' } });
      await userEvent.type(screen.getByLabelText(/Price/i), '10.99');
      await userEvent.click(screen.getByLabelText(/I agree to the/i));
      await userEvent.click(screen.getByText(/Select Dataset File/i));
    });

    await waitFor(() => {
      expect(screen.getByText('Local File')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Local File'));
      const fileInput = screen.getByTestId('file-input');
      await fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
      await userEvent.click(screen.getByText(/Upload Dataset/i));
    });

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `${BACKEND_URL}/datasets/create_dataset/`,
        expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
      );
      expect(screen.getByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
    });
  });

  test('handles form submission error', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to upload dataset' }),
    });

    render(<DatasetForm />);
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Title/i), 'Test Dataset');
      await userEvent.type(screen.getByLabelText(/Description/i), 'This is a test dataset with a detailed description that exceeds the minimum requirement of 100 characters. It contains information about testing.');
      await userEvent.type(screen.getByLabelText(/Tags/i), 'test,dataset');
      await fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'category1' } });
      await userEvent.type(screen.getByLabelText(/Price/i), '10.99');
      await userEvent.click(screen.getByLabelText(/I agree to the/i));
      await userEvent.click(screen.getByText(/Select Dataset File/i));
    });

    await waitFor(() => {
      expect(screen.getByText('Local File')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Local File'));
      const fileInput = screen.getByTestId('file-input');
      await fireEvent.change(fileInput, { target: { files: [createMockFile()] } });
      await userEvent.click(screen.getByText(/Upload Dataset/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Failed to upload dataset/i)).toBeInTheDocument();
    });
  });

  test('validates file type correctly', async () => {
    render(<DatasetForm />);
    await act(async () => {
      await userEvent.type(screen.getByLabelText(/Title/i), 'Test Dataset');
      await userEvent.type(screen.getByLabelText(/Description/i), 'This is a test dataset with a detailed description that exceeds the minimum requirement of 100 characters. It contains information about testing.');
      await userEvent.type(screen.getByLabelText(/Tags/i), 'test,dataset');
      await fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: 'category1' } });
      await userEvent.type(screen.getByLabelText(/Price/i), '10.99');
      await userEvent.click(screen.getByLabelText(/I agree to the/i));
      await userEvent.click(screen.getByText(/Select Dataset File/i));
    });

    await waitFor(() => {
      expect(screen.getByText('Local File')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Local File'));
      const fileInput = screen.getByTestId('file-input');
      await fireEvent.change(fileInput, { target: { files: [createMockFile('test.txt', 1024, 'text/plain')] } });
      await userEvent.click(screen.getByText(/Upload Dataset/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });

  test('opens and closes the file source modal', async () => {
    render(<DatasetForm />);
    await act(async () => {
      await userEvent.click(screen.getByText(/Select Dataset File/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/Select File Source/i)).toBeInTheDocument();
      expect(screen.getByText('Local File')).toBeInTheDocument();
      expect(screen.getByText('Dropbox')).toBeInTheDocument();
      expect(screen.getByText('OneDrive')).toBeInTheDocument();
      expect(screen.getByText('Google Drive')).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(screen.getByText(/Cancel/i));
    });

    await waitFor(() => {
      expect(screen.queryByText(/Select File Source/i)).not.toBeInTheDocument();
    });
  });

  test('handles Dropbox file selection', async () => {
    render(<DatasetForm />);
    mockDropboxChoose.mockImplementationOnce((options) => {
      options.success([{ link: 'https://dropbox.com/file.csv', name: 'dropbox_file.csv' }]);
    });

    await act(async () => {
      await userEvent.click(screen.getByText(/Select Dataset File/i));
      await userEvent.click(screen.getByText('Dropbox'));
    });

    expect(mockDropboxChoose).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/dropbox_file.csv/i)).toBeInTheDocument();
      expect(screen.getByText(/From cloud storage/i)).toBeInTheDocument();
    });
  });


  test('handles OneDrive file selection', async () => {
    render(<DatasetForm />);
    mockOneDriveOpen.mockImplementationOnce((options) => {
      options.success({ value: [{ webUrl: 'https://onedrive.com/file.csv', name: 'onedrive_file.csv' }] });
    });

    await act(async () => {
      await userEvent.click(screen.getByText(/Select Dataset File/i));
      await userEvent.click(screen.getByText('OneDrive'));
    });

    expect(mockOneDriveOpen).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/onedrive_file.csv/i)).toBeInTheDocument();
      expect(screen.getByText(/From cloud storage/i)).toBeInTheDocument();
    });
  });
});