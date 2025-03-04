// src/__tests__/auth/org-register.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import AddOrganizationForm from '../../app/auth/sign-up/org-sign-up/page'; // Verify this path

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/config', () => ({
  BACKEND_URL: 'http://localhost:8000',
}));

interface MockFetchResponse extends Response {
  ok: boolean;
  json: () => Promise<unknown>;
}

global.fetch = jest.fn() as jest.Mock<Promise<MockFetchResponse>>;

describe('AddOrganizationForm', () => {
  let pushMock: jest.Mock;

  beforeEach(() => {
    pushMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (global.fetch as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the form correctly', () => {
    render(<AddOrganizationForm />);

    
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Admin Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register organization/i })).toBeInTheDocument();
  });

  it('updates form fields on input change', () => {
    render(<AddOrganizationForm />);

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Test Org' } });
    expect(nameInput.value).toBe('Test Org');

    const adminEmailInput = screen.getByLabelText('Admin Email') as HTMLInputElement;
    fireEvent.change(adminEmailInput, { target: { value: 'admin@test.com' } });
    expect(adminEmailInput.value).toBe('admin@test.com');
  });

  it('shows password mismatch error', async () => {
    render(<AddOrganizationForm />);

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123' } });

    const form = screen.getByTestId('org-registration-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

 

  it('handles successful form submission', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });
  
    render(<AddOrganizationForm />);
  
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Org' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Desc' } });
    fireEvent.change(screen.getByLabelText('Organization Email'), { target: { value: 'org@test.com' } });
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Admin Email'), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText('Admin Phone'), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'Password123!' } });
  
    const form = screen.getByTestId('org-registration-form');
    fireEvent.submit(form);
  
    await waitFor(() => {
      expect(screen.getByText('Organization Registered Successfully!')).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/organisation/register-org/', // Changed to match received URL
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Test Org',
            description: 'Test Desc',
            email: 'org@test.com',
            phone: '+1234567890',
            address: '123 Test St',
            admin: {
              first_name: 'John',
              sur_name: 'Doe',
              email: 'admin@test.com',
              phone_number: '+1234567890',
              password: 'Password123!',
              password2: 'Password123!',
            },
          }),
        })
      );
    });
  
    jest.advanceTimersByTime(2000);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/auth/sign-in');
    });
  });
});