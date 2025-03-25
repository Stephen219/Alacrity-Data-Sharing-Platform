
import ActivateAccount from '@/app/organisation/contributors/activate/page';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useSearchParams } from 'next/navigation';


jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));


global.fetch = jest.fn();

describe('ActivateAccount Component', () => {
  beforeEach(() => {
    
    jest.clearAllMocks();
    
    process.env.BACKEND_URL = 'http://127.0.0.1:8000'; 
  });

  test('renders loading state initially with valid token', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'valid-token',
    });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Please set your password.' }),
    });

    // Act
    render(<ActivateAccount />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Activate Your Account')).toBeInTheDocument();
      expect(screen.getByText('Set your password to complete the activation process')).toBeInTheDocument();
    });
  });

  test('shows error message with invalid token', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'invalid-token',
    });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid or expired token' }),
    });

    // Act
    render(<ActivateAccount />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
    });
  });

  test('handles password mismatch error', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'valid-token',
    });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Please set your password.' }),
    });

    render(<ActivateAccount />);

    
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    // Act
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  test('submits form successfully with matching passwords', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'valid-token',
    });
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Please set your password.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Account activated successfully' }),
      });

    // Mock window.location.href and alert
    const mockLocation = { href: '' };
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
    });
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ActivateAccount />);

    
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    // Act
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/organisation/activate_contributor/', // Match exact URL with double slash
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'valid-token',
            password: 'SecurePass123!',
            confirm_password: 'SecurePass123!',
          }),
        })
      );
      expect(mockAlert).toHaveBeenCalledWith('Account activated! You can now log in.');
      expect(mockLocation.href).toBe('/login');
    });

    // Cleanup
    mockAlert.mockRestore();
  });

  test('toggles password visibility', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'valid-token',
    });
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Please set your password.' }),
    });

    render(<ActivateAccount />);

    
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
    const toggleButton = screen.getAllByRole('button')[0]; // First button is password toggle

    // Act & Assert - Initially hidden
    expect(passwordInput.type).toBe('password');

    // Act - Toggle to show
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Act - Toggle back to hide
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('displays loading state during submission', async () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => 'valid-token',
    });
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Please set your password.' }),
      })
      .mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Account activated successfully' }),
      }), 100))); // Simulate delay

    render(<ActivateAccount />);

  
    await waitFor(() => {
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    // Act
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'SecurePass123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'SecurePass123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Activate Account/i }));

    // Assert - Loading state
    expect(screen.getByText('Activating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activating.../i })).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByText('Activating...')).not.toBeInTheDocument();
    });
  });
});