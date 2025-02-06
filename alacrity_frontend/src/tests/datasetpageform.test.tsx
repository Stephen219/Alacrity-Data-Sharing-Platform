import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatasetForm from '@/components/dataForm';

// Mock fetch globally
global.fetch = jest.fn();

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

describe('DatasetForm Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  // Helper function to fill out form with valid data
  const fillOutForm = (description = 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents, format, and intended use cases for researchers and analysts.') => {
    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Dataset' }
    });
    
    fireEvent.change(screen.getByLabelText(/description/i), { 
      target: { value: description }
    });
    
    fireEvent.change(screen.getByLabelText(/tags/i), { 
      target: { value: 'test,data' }
    });
    
    fireEvent.change(screen.getByLabelText(/category/i), { 
      target: { value: 'category1' }
    });
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/select file/i), { 
      target: { files: [file] }
    });
    
    fireEvent.click(screen.getByLabelText(/i agree to the/i));
  };

  test('renders form correctly', () => {
    render(<DatasetForm />);
    
    expect(screen.getByText(/Add a new dataset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select file/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i agree to the/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Data/i)).toBeInTheDocument();
  });

  test('shows validation errors on submit with empty fields', async () => {
    render(<DatasetForm />);
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one tag is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a file to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/You must agree to the license terms/i)).toBeInTheDocument();
    });
  });

  test('validates description length', async () => {
    render(<DatasetForm />);
    
    fillOutForm('Too short description');
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
    });
  });

  test('validates file type', async () => {
    render(<DatasetForm />);
    
   
    fireEvent.change(screen.getByLabelText(/title/i), { 
      target: { value: 'Test Dataset' }
    });
    
    fireEvent.change(screen.getByLabelText(/description/i), { 
      target: { value: 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents.' }
    });
    
    fireEvent.change(screen.getByLabelText(/tags/i), { 
      target: { value: 'test,data' }
    });
    
    fireEvent.change(screen.getByLabelText(/category/i), { 
      target: { value: 'category1' }
    });
    
    // Upload invalid file type
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/select file/i), { 
      target: { files: [invalidFile] }
    });
    
    fireEvent.click(screen.getByLabelText(/i agree to the/i));
    
    // Submit form
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
   
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
    });

    render(<DatasetForm />);
    
    fillOutForm();
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Verify fetch was called with correct URL and method
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/datasets/create_dataset/'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    
    await waitFor(() => {
      expect(screen.getByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
    });

    
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
    expect(screen.getByLabelText(/tags/i)).toHaveValue('');
    expect(screen.getByLabelText(/category/i)).toHaveValue('');
    expect(screen.getByLabelText(/i agree to the/i)).not.toBeChecked();
  });

  test('handles server error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    render(<DatasetForm />);
    
    fillOutForm();
    
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  test('handles loading state during submission', async () => {
   
    (fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
          }), 
          100
        )
      )
    );

    render(<DatasetForm />);
    
    fillOutForm();
    
  
    fireEvent.click(screen.getByText(/Upload Data/i));
    
   
    expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
  
    await waitFor(() => {
      expect(screen.getByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
      expect(screen.getByText(/Upload Data/i)).toBeInTheDocument();
    });
  });
});