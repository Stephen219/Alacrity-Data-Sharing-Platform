import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DatasetForm from '@/components/dataForm';
import '@testing-library/jest-dom/extend-expect';

// Mock the fetch function
global.fetch = jest.fn();

describe('DatasetForm Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders the form correctly', () => {
    render(<DatasetForm />);
    expect(screen.getByLabelText(/Dataset Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dataset Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dataset Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload Dataset/i)).toBeInTheDocument();
  });

  test('validates input fields before submission', async () => {
    render(<DatasetForm />);

    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Dataset name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Dataset description is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please upload a dataset/i)).toBeInTheDocument();
  });

  test('handles file upload', async () => {
    render(<DatasetForm />);
    const fileInput = screen.getByLabelText(/Upload Dataset/i);
    const file = new File(['test content'], 'testfile.csv', { type: 'text/csv' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(fileInput.files[0]).toBe(file));
  });

  test('submits form successfully', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: jest.fn(() => Promise.resolve({ success: true })) });
    render(<DatasetForm />);

    fireEvent.change(screen.getByLabelText(/Dataset Name/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Dataset Description/i), { target: { value: 'A test dataset' } });
    fireEvent.change(screen.getByLabelText(/Dataset Type/i), { target: { value: 'Type A' } });
    
    const fileInput = screen.getByLabelText(/Upload Dataset/i);
    const file = new File(['test content'], 'testfile.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Dataset uploaded successfully/i)).toBeInTheDocument();
  });

  test('handles submission errors', async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: jest.fn(() => Promise.resolve({ message: 'Error uploading dataset' })) });
    render(<DatasetForm />);

    fireEvent.change(screen.getByLabelText(/Dataset Name/i), { target: { value: 'Test Dataset' } });
    fireEvent.change(screen.getByLabelText(/Dataset Description/i), { target: { value: 'A test dataset' } });
    fireEvent.change(screen.getByLabelText(/Dataset Type/i), { target: { value: 'Type A' } });
    
    const fileInput = screen.getByLabelText(/Upload Dataset/i);
    const file = new File(['test content'], 'testfile.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    fireEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Error uploading dataset/i)).toBeInTheDocument();
  });
});
