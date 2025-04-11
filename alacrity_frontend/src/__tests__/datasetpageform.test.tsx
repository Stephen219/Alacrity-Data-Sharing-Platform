// File: datasetpageform.test.tsx#
// #
// ignore all tsx errors in this file
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatasetForm from '@/components/dataForm'
import { fetchWithAuth } from '@/libs/auth';

const mockedFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;







jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@/config', () => ({
  BACKEND_URL: 'http://localhost:8000',
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/cartegorySelect', () => {
  return function MockedCategoryInput({ category, onCategoryChange }: { category: string; onCategoryChange: (value: string) => void }) {
    return (
      <select
        data-testid="category-select"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">Select category</option>
        <option value="Clinical Data">Clinical Data</option>
        <option value="Genomics">Genomics</option>
        <option value="Medical Imaging">Medical Imaging</option>
      </select>
    );
  };
});

jest.mock('@/components/ui/Loader', () => {
  return function MockedLoader() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('@/components/ui/Upload', () => {
  return function MockedUploadIcon() {
    return <div data-testid="upload-icon">Upload Icon</div>;
  };
});

jest.mock('@/components/MaxWidthWrapper', () => {
  return function MockedMaxWidthWrapper({ children }: { children: React.ReactNode }) {
    return <div data-testid="max-width-wrapper">{children}</div>;
  };
});

// Mock the window global objects needed for cloud storage
declare global {
  // eslint-disable-next-line no-var
  var gapi: {
    load: (api: string, callback: () => void) => void;
    client: {
      init: () => Promise<void>;
      drive: {
        files: {
          get: () => Promise<{ result: { webContentLink: string; name: string } }>;
        };
      };
    };
  };

  // Extend global to include google property
  // eslint-disable-next-line no-var
  var google: {
    accounts: {
      oauth2: {
        initTokenClient: jest.Mock;
      };
    };
    picker: {
      PickerBuilder: jest.Mock;
      Action: { PICKED: string };
      ViewId: { DOCS: string; SPREADSHEETS: string; PDFS: string };
      Feature: { NAV_HIDDEN: string };
    };
  };
}

global.gapi = {
  load: jest.fn((api, callback) => callback()),
  client: {
    init: jest.fn().mockResolvedValue({}),
    drive: {
      files: {
        get: jest.fn().mockResolvedValue({ result: { webContentLink: 'https://test.com/file', name: 'test.csv' } }),
      },
    },
  },
};

global.google = {
  accounts: {
    oauth2: {
      initTokenClient: jest.fn().mockReturnValue({
        requestAccessToken: jest.fn(),
      }),
    },
  },
  picker: {
    PickerBuilder: jest.fn().mockReturnValue({
      addView: jest.fn().mockReturnThis(),
      enableFeature: jest.fn().mockReturnThis(),
      setOAuthToken: jest.fn().mockReturnThis(),
      setDeveloperKey: jest.fn().mockReturnThis(),
      setCallback: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({
        setVisible: jest.fn(),
      }),
    }),
    Action: { PICKED: 'picked' },
    ViewId: { DOCS: 'docs', SPREADSHEETS: 'spreadsheets', PDFS: 'pdfs' },
    Feature: { NAV_HIDDEN: 'nav_hidden' },
  },
};

declare global {
  // eslint-disable-next-line no-var
  var Dropbox: {
    choose: (options: { success?: (files: { link: string; name: string }[]) => void }) => void;
  };

  // eslint-disable-next-line no-var
  var OneDrive: {
    open: (options: { success?: (result: { value: { webUrl: string; name: string }[] }) => void }) => void;
  };
}

global.Dropbox = {
  choose: jest.fn().mockImplementation((options) => {
    if (options.success) {
      options.success([{ link: 'https://dropbox.com/file', name: 'dropbox_file.csv' }]);
    }
  }),
};

global.OneDrive = {
  open: jest.fn().mockImplementation((options) => {
    if (options.success) {
      options.success({ value: [{ webUrl: 'https://onedrive.com/file', name: 'onedrive_file.csv' }] });
    }
  }),
};

describe('DatasetForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  mockedFetchWithAuth.mockResolvedValue({

    ok: true,
    json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' }),
  });

  test('renders the form with all required fields', () => {
    render(<DatasetForm />);
    
    // Check for main form elements
    expect(screen.getByText('Add New Dataset')).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Tags/i)).toBeInTheDocument();
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
    expect(screen.getByText(/Select Dataset File/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Dataset/i)).toBeInTheDocument();
  });

  test('shows validation errors when form is submitted with empty fields', async () => {
    render(<DatasetForm />);
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByText(/Upload Dataset/i));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required and must be at least 100 characters')).toBeInTheDocument();
      expect(screen.getByText('Please select a category')).toBeInTheDocument();
      expect(screen.getByText('At least one tag is required')).toBeInTheDocument();
      expect(screen.getByText('Please select a file to upload')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the license terms')).toBeInTheDocument();
      expect(screen.getByText('Price is required')).toBeInTheDocument();
    });
  });

  test('allows uploading a local file', () => {
    render(<DatasetForm />);
    
    // Trigger file selection modal
    fireEvent.click(screen.getByText(/Select Dataset File/i));
    
    // Click on Local File option
    fireEvent.click(screen.getByText(/Local File/i));
    
    // Create a mock file
    const file = new File(['test file content'], 'test.csv', { type: 'text/csv' });
    
    // Find the hidden file input and simulate file selection
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Check if file info is displayed
    expect(screen.getByText('test.csv')).toBeInTheDocument();
  });

  test('integrates with Dropbox for file selection', async () => {
    render(<DatasetForm />);
    
    // Trigger file selection modal
    fireEvent.click(screen.getByText(/Select Dataset File/i));
    
    // Click on Dropbox option
    fireEvent.click(screen.getByText(/Dropbox/i));
    
    // Verify Dropbox.choose was called
    expect(global.Dropbox.choose).toHaveBeenCalled();
    
    // Check if dropbox file info is displayed
    await waitFor(() => {
      expect(screen.getByText('dropbox_file.csv')).toBeInTheDocument();
      expect(screen.getByText('From cloud storage')).toBeInTheDocument();
    });
  });

  test('integrates with OneDrive for file selection', async () => {
    render(<DatasetForm />);
    
    // Trigger file selection modal
    fireEvent.click(screen.getByText(/Select Dataset File/i));
    
    // Click on OneDrive option
    fireEvent.click(screen.getByText(/OneDrive/i));
    
    // Verify OneDrive.open was called
    expect(global.OneDrive.open).toHaveBeenCalled();
    
    // Check if OneDrive file info is displayed
    await waitFor(() => {
      expect(screen.getByText('onedrive_file.csv')).toBeInTheDocument();
      expect(screen.getByText('From cloud storage')).toBeInTheDocument();
    });
  });



  test('handles network error during form submission', async () => {
    // Mock a network error
    fetchWithAuth.mockRejectedValue(new Error('Network error'));
    
    render(<DatasetForm />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description that is more than 100 characters long. It should pass validation and allow the form to be submitted successfully. Testing is important.' },
    });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'Clinical Data' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'test,data,health' } });
    
    const file = new File(['test file content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10.99' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    
    // Submit form
    fireEvent.click(screen.getByText(/Upload Dataset/i));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalled();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  test('shows loading overlay during form submission', async () => {
    // Make fetchWithAuth take some time to resolve
    fetchWithAuth.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => {
        resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' }),
        });
      }, 100);
    }));
    
    render(<DatasetForm />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description that is more than 100 characters long. It should pass validation and allow the form to be submitted successfully. Testing is important.' },
    });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'Clinical Data' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'test,data,health' } });
    
    const file = new File(['test file content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10.99' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    

    fireEvent.click(screen.getByText(/Upload Dataset/i));
    
 
    expect(await screen.findByText('Uploading your Data...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
  
    await waitFor(() => {
      expect(screen.getByText('Dataset uploaded successfully!')).toBeInTheDocument();
    });
  });

  test('validates file type when uploading', async () => {
    render(<DatasetForm />);
    
    // Upload an invalid file type
    const file = new File(['test file content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Fill other fields
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'This is a test description that is more than 100 characters long. It should pass validation and allow the form to be submitted successfully. Testing is important.' },
    });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'Clinical Data' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'test,data,health' } });
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10.99' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    
    // Submit form
    fireEvent.click(screen.getByText(/Upload Dataset/i));
    

    await waitFor(() => {
      expect(screen.getByText('Invalid file type. Only CSV and Excel files are allowed')).toBeInTheDocument();
    });
    
    // Ensure fetch was not called
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  test('prevents form submission if description is too short', async () => {
    render(<DatasetForm />);
    
   
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Too short' } });
    fireEvent.change(screen.getByTestId('category-select'), { target: { value: 'Clinical Data' } });
    fireEvent.change(screen.getByLabelText(/Tags/i), { target: { value: 'test,data,health' } });
    
    const file = new File(['test file content'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByTestId('file-input');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    fireEvent.change(screen.getByLabelText(/Price/i), { target: { value: '10.99' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    
    // Submit form
    fireEvent.click(screen.getByText(/Upload Dataset/i));
    
    // Check for description validation error
    await waitFor(() => {
      expect(screen.getByText('Description is required and must be at least 100 characters')).toBeInTheDocument();
    });
    
    // Ensure fetch was not called
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });
});