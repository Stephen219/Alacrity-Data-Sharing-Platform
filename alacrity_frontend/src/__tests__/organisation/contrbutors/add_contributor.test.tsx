

// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom';
// import AddContributorForm from '@/app/organisation/contributors/add/page';  
// import { useRouter } from 'next/navigation';
// import { fetchWithAuth } from '@/libs/auth';


// jest.mock('next/navigation', () => ({
//   useRouter: jest.fn(),
// }));

// // Mock fetchWithAuth
// jest.mock('@/libs/auth', () => ({
//   fetchWithAuth: jest.fn(),
// }));

// describe('AddContributorForm Component', () => {
//   const mockPush = jest.fn();
//   const mockRouter = { push: mockPush };

//   beforeEach(() => {
//     jest.clearAllMocks();
//     (useRouter as jest.Mock).mockReturnValue(mockRouter);
//   });

//   test('renders form initially', () => {
//     render(<AddContributorForm />);
//     expect(screen.getByText('Add New Contributor')).toBeInTheDocument();
//     expect(screen.getByText('Invite a team member to collaborate on your organization')).toBeInTheDocument();
//     expect(screen.getByLabelText('First Name')).toBeInTheDocument();
//     expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
//     expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
//     expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
//     expect(screen.getByLabelText('Role')).toBeInTheDocument();
//     expect(screen.getByRole('button', { name: /Add Contributor/i })).toBeInTheDocument();
//   });

//   test('handles input changes and clears errors', () => {
//     render(<AddContributorForm />);
//     const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
//     const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;

//     fireEvent.change(firstNameInput, { target: { value: 'John' } });
//     expect(firstNameInput.value).toBe('John');

//     fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
//     expect(emailInput.value).toBe('john@example.com');
//   });

//   // test('submits form successfully and redirects', async () => {
//   //   (fetchWithAuth as jest.Mock).mockResolvedValue({
//   //     ok: true,
//   //     json: async () => ({ message: 'Contributor added' }),
//   //   });

//   //   render(<AddContributorForm />);

//   //   fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
//   //   fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
//   //   fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
//   //   fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
//   //   fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'contributor' } });

//   //   fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

//   //   expect(screen.getByText('Processing...')).toBeInTheDocument();
//   //   expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled();

//   //   await waitFor(() => {
//   //     expect(screen.getByText('Contributor Added Successfully!')).toBeInTheDocument();
//   //     expect(screen.getByText('Redirecting you to the dashboard...')).toBeInTheDocument();
//   //     expect(fetchWithAuth).toHaveBeenCalledWith(
//   //       'http://127.0.0.1:8000/organisation/add_contributor/',
//   //       expect.objectContaining({
//   //         method: 'POST',
//   //         headers: { 'Content-Type': 'application/json' },
//   //         body: JSON.stringify({
//   //           first_name: 'John',
//   //           sur_name: 'Doe',
//   //           email: 'john.doe@example.com',
//   //           phone_number: '+1234567890',
//   //           role: 'contributor',
//   //         }),
//   //       })
//   //     );
//   //   });

//   //   jest.advanceTimersByTime(2000);
//   //   expect(mockPush).toHaveBeenCalledWith('/dashboard');
//   // });

  
//   test('handles general server error', async () => {
//     (fetchWithAuth as jest.Mock).mockResolvedValue({
//       ok: false,
//       json: async () => ({ error: 'Invalid role specified' }),
//     });

//     render(<AddContributorForm />);

//     fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
//     fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
//     fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
//     fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
//     fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

//     await waitFor(() => {
//       expect(screen.getByText('Invalid role specified')).toBeInTheDocument();
//       expect(screen.queryByText('Contributor Added Successfully!')).not.toBeInTheDocument();
//     });
//   });

//   test('handles network error', async () => {
//     (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Network error'));

//     render(<AddContributorForm />);

//     fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
//     fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
//     fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
//     fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
//     fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

//     await waitFor(() => {
//       expect(screen.getByText('A network error occurred. Please try again.')).toBeInTheDocument();
//       expect(screen.queryByText('Contributor Added Successfully!')).not.toBeInTheDocument();
//     });
//   });

//   test('displays loading state during submission', async () => {
//     (fetchWithAuth as jest.Mock).mockImplementation(() =>
//       new Promise(resolve =>
//         setTimeout(() => resolve({
//           ok: true,
//           json: async () => ({ message: 'Contributor added' }),
//         }), 100)
//       )
//     );

//     render(<AddContributorForm />);

//     fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
//     fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
//     fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
//     fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
//     fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

//     expect(screen.getByText('Processing...')).toBeInTheDocument();
//     expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled();

//     await waitFor(() => {
//       expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
//       expect(screen.getByText('Contributor Added Successfully!')).toBeInTheDocument();
//     });
//   });

  
// });


// jest.useFakeTimers();



import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddContributorForm from '@/app/organisation/contributors/add/page';  
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/libs/auth';
// import * as Auth from '@/components/auth_guard/AccessControl';


jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));


jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));


jest.mock('@/components/auth_guard/AccessControl', () => ({
  withAccessControl: jest.fn((component) => component),
  useAuth: jest.fn(() => ({
    user: { role: 'organization_admin' },
    isLoading: false,
    isAuthenticated: true
  })),
}));

describe('AddContributorForm Component', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  test('renders form initially', () => {
    render(<AddContributorForm />);
    expect(screen.getByText('Add New Contributor')).toBeInTheDocument();
    expect(screen.getByText('Invite a team member to collaborate on your organization')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Contributor/i })).toBeInTheDocument();
  });

  test('handles input changes and clears errors', () => {
    render(<AddContributorForm />);
    const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(firstNameInput.value).toBe('John');

    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    expect(emailInput.value).toBe('john@example.com');
  });

  test('handles general server error', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid role specified' }),
    });

    render(<AddContributorForm />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid role specified')).toBeInTheDocument();
      expect(screen.queryByText('Contributor Added Successfully!')).not.toBeInTheDocument();
    });
  });

  test('handles network error', async () => {
    (fetchWithAuth as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AddContributorForm />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

    await waitFor(() => {
      expect(screen.getByText('A network error occurred. Please try again.')).toBeInTheDocument();
      expect(screen.queryByText('Contributor Added Successfully!')).not.toBeInTheDocument();
    });
  });

  test('displays loading state during submission', async () => {
    (fetchWithAuth as jest.Mock).mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Contributor added' }),
        }), 100)
      )
    );

    render(<AddContributorForm />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
    fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Processing.../i })).toBeDisabled();

    await waitFor(() => {
      expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      expect(screen.getByText('Contributor Added Successfully!')).toBeInTheDocument();
    });
  });

  test('submits form successfully and redirects', async () => {
    (fetchWithAuth as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Contributor added' }),
    });

    // Setup and use jest's fake timers
    jest.useFakeTimers();

    render(<AddContributorForm />);

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'john.doe@example.com' } });
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '+1234567890' } });
    fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'contributor' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Contributor/i }));

    await waitFor(() => {
      expect(screen.getByText('Contributor Added Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Redirecting you to the dashboard...')).toBeInTheDocument();
    });

    // Advance timers to trigger the redirect
    jest.advanceTimersByTime(2000);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    
    // Cleanup
    jest.useRealTimers();
  });
});