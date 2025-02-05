
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatasetForm from '@/components/dataForm';

global.fetch = jest.fn();

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

describe('DatasetForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  const fillOutForm = () => {
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A detailed description of the test dataset' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: 'test,data' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'category1' } });
    
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(screen.getByLabelText(/select file/i), { target: { files: [file] } });
    
    // Agree to terms
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
  });

  test('shows validation errors on submit with empty fields', async () => {
    render(<DatasetForm />);
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/At least one tag is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a file to upload/i)).toBeInTheDocument();
      expect(screen.getByText(/You must agree to the license terms/i)).toBeInTheDocument();
    });
  });

  test('submits form successfully', async () => {
    // Mock successful fetch response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Upload successful' })
    });

    render(<DatasetForm />);
    
    
    fillOutForm();
    
    // Submit the form
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    // Wait for loading state and success
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('Dataset uploaded successfully!');
    });
  });

  test('handles server error', async () => {
    
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

    render(<DatasetForm />);
    
    // Fill out the form
    fillOutForm();
    
    // Submit the form
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    // Wait for error handling
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockAlert).toHaveBeenCalledWith('An error occurred while uploading. Please try again.');
    });
  });

  test('file type validation', async () => {
    render(<DatasetForm />);
    
    
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A detailed description' } });
    fireEvent.change(screen.getByLabelText(/tags/i), { target: { value: 'test,data' } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: 'category1' } });
    fireEvent.click(screen.getByLabelText(/i agree to the/i));
    
    
    const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText(/select file/i), { target: { files: [invalidFile] } });
    
    
    fireEvent.click(screen.getByText(/Upload Data/i));
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });
});