// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom';
// import DatasetForm from '@/components/dataForm';

// // Mock fetch globally
// global.fetch = jest.fn();

// // Mock window.alert
// const mockAlert = jest.fn();
// window.alert = mockAlert;

// describe('DatasetForm Component', () => {
//   // Reset all mocks before each test
//   beforeEach(() => {
//     jest.clearAllMocks();
//     (fetch as jest.Mock).mockClear();
//   });

//   // Helper function to fill out form with valid data
//   const fillOutForm = (description = 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents, format, and intended use cases for researchers and analysts.') => {
//     fireEvent.change(screen.getByLabelText(/title/i), { 
//       target: { value: 'Test Dataset' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/description/i), { 
//       target: { value: description }
//     });
    
//     fireEvent.change(screen.getByLabelText(/tags/i), { 
//       target: { value: 'test,data' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/category/i), { 
//       target: { value: 'category1' }
//     });
    
//     const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
//     fireEvent.change(screen.getByLabelText(/select file/i), { 
//       target: { files: [file] }
//     });
    
//     fireEvent.click(screen.getByLabelText(/i agree to the/i));
//   };

//   test('renders form correctly', () => {
//     render(<DatasetForm />);
    
//     expect(screen.getByText(/Add a new dataset/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/select file/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/i agree to the/i)).toBeInTheDocument();
//     expect(screen.getByText(/Upload Data/i)).toBeInTheDocument();
//   });

//   test('shows validation errors on submit with empty fields', async () => {
//     render(<DatasetForm />);
    
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
//     await waitFor(() => {
//       expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
//       expect(screen.getByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
//       expect(screen.getByText(/Please select a category/i)).toBeInTheDocument();
//       expect(screen.getByText(/At least one tag is required/i)).toBeInTheDocument();
//       expect(screen.getByText(/Please select a file to upload/i)).toBeInTheDocument();
//       expect(screen.getByText(/You must agree to the license terms/i)).toBeInTheDocument();
//     });
//   });

//   test('validates description length', async () => {
//     render(<DatasetForm />);
    
//     fillOutForm('Too short description');
    
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
//     await waitFor(() => {
//       expect(screen.getByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
//     });
//   });

//   test('validates file type', async () => {
//     render(<DatasetForm />);
    
   
//     fireEvent.change(screen.getByLabelText(/title/i), { 
//       target: { value: 'Test Dataset' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/description/i), { 
//       target: { value: 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents.' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/tags/i), { 
//       target: { value: 'test,data' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/category/i), { 
//       target: { value: 'category1' }
//     });
    
//     // Upload invalid file type
//     const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
//     fireEvent.change(screen.getByLabelText(/select file/i), { 
//       target: { files: [invalidFile] }
//     });
    
//     fireEvent.click(screen.getByLabelText(/i agree to the/i));
    
//     // Submit form
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
//     await waitFor(() => {
//       expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
//     });
//   });

//   test('submits form successfully', async () => {
   
//     (fetch as jest.Mock).mockResolvedValueOnce({
//       ok: true,
//       json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
//     });

//     render(<DatasetForm />);
    
//     fillOutForm();
    
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
//     await waitFor(() => {
      
//       expect(fetch).toHaveBeenCalledTimes(1);
      
//       // Verify fetch was called with correct URL and method
//       expect(fetch).toHaveBeenCalledWith(
//         expect.stringContaining('/datasets/create_dataset/'),
//         expect.objectContaining({
//           method: 'POST',
//           body: expect.any(FormData)
//         })
//       );
//     });

    
//     await waitFor(() => {
//       expect(screen.getByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
//     });

    
//     expect(screen.getByLabelText(/title/i)).toHaveValue('');
//     expect(screen.getByLabelText(/description/i)).toHaveValue('');
//     expect(screen.getByLabelText(/tags/i)).toHaveValue('');
//     expect(screen.getByLabelText(/category/i)).toHaveValue('');
//     expect(screen.getByLabelText(/i agree to the/i)).not.toBeChecked();
//   });

//   test('handles server error', async () => {
//     (fetch as jest.Mock).mockRejectedValueOnce(new Error('Upload failed'));

//     render(<DatasetForm />);
    
//     fillOutForm();
    
    
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
//     await waitFor(() => {
      
//       expect(fetch).toHaveBeenCalledTimes(1);
//     });
//   });

//   test('handles loading state during submission', async () => {
   
//     (fetch as jest.Mock).mockImplementationOnce(() => 
//       new Promise(resolve => 
//         setTimeout(() => 
//           resolve({
//             ok: true,
//             json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
//           }), 
//           100
//         )
//       )
//     );

//     render(<DatasetForm />);
    
//     fillOutForm();
    
  
//     fireEvent.click(screen.getByText(/Upload Data/i));
    
   
//     expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
  
//     await waitFor(() => {
//       expect(screen.getByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
//       expect(screen.getByText(/Upload Data/i)).toBeInTheDocument();
//     });
//   });
// });



// import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import '@testing-library/jest-dom';
// import DatasetForm from '@/components/dataForm';

// // Mock fetch globally
// global.fetch = jest.fn();

// describe('DatasetForm Component', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   const fillOutForm = (description = 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents, format, and intended use cases for researchers and analysts.') => {
//     fireEvent.change(screen.getByLabelText(/title/i), { 
//       target: { value: 'Test Dataset' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/description/i), { 
//       target: { value: description }
//     });
    
//     fireEvent.change(screen.getByLabelText(/tags/i), { 
//       target: { value: 'test,data' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/category/i), { 
//       target: { value: 'category1' }
//     });
    
//     const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
//     fireEvent.change(screen.getByLabelText(/select file/i), { 
//       target: { files: [file] }
//     });
    
//     fireEvent.click(screen.getByLabelText(/i agree to the/i));
//   };

//   test('renders form correctly', () => {
//     render(<DatasetForm />);
    
//     expect(screen.getByText(/Add a new dataset/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/tags/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/select file/i)).toBeInTheDocument();
//     expect(screen.getByLabelText(/i agree to the/i)).toBeInTheDocument();
//     expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
//   });

//   test('shows validation errors on submit with empty fields', async () => {
//     render(<DatasetForm />);
    
//     fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
//     expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
//     expect(await screen.findByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
//     expect(await screen.findByText(/Please select a category/i)).toBeInTheDocument();
//     expect(await screen.findByText(/At least one tag is required/i)).toBeInTheDocument();
//     expect(await screen.findByText(/Please select a file to upload/i)).toBeInTheDocument();
//     expect(await screen.findByText(/You must agree to the license terms/i)).toBeInTheDocument();
//   });

//   test('validates description length', async () => {
//     render(<DatasetForm />);
    
//     fillOutForm('Too short description');
    
//     fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
//     expect(await screen.findByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
//   });

//   test('validates file type', async () => {
//     render(<DatasetForm />);
    
//     // Fill out form except file
//     fireEvent.change(screen.getByLabelText(/title/i), { 
//       target: { value: 'Test Dataset' }
//     });
    
//     const longDescription = 'This is a very detailed description of the test dataset that meets the minimum length requirement. It includes comprehensive information about the data contents.';
//     fireEvent.change(screen.getByLabelText(/description/i), { 
//       target: { value: longDescription }
//     });
    
//     fireEvent.change(screen.getByLabelText(/tags/i), { 
//       target: { value: 'test,data' }
//     });
    
//     fireEvent.change(screen.getByLabelText(/category/i), { 
//       target: { value: 'category1' }
//     });
    
//     // Upload invalid file type
//     const invalidFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
//     fireEvent.change(screen.getByLabelText(/select file/i), { 
//       target: { files: [invalidFile] }
//     });
    
//     fireEvent.click(screen.getByLabelText(/i agree to the/i));
    
//     fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
//     expect(await screen.findByText(/Invalid file type/i)).toBeInTheDocument();
//   });

//   test('submits form successfully', async () => {
//     const mockResponse = { ok: true, json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' }) };
//     (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

//     render(<DatasetForm />);
//     fillOutForm();
    
//     fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));

//     // First verify loading state
//     expect(await screen.findByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
//     // Then verify success message
//     expect(await screen.findByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();

//     // Verify form reset
//     await waitFor(() => {
//       expect(screen.getByLabelText(/title/i)).toHaveValue('');
//       expect(screen.getByLabelText(/description/i)).toHaveValue('');
//       expect(screen.getByLabelText(/tags/i)).toHaveValue('');
//       expect(screen.getByLabelText(/category/i)).toHaveValue('');
//       expect(screen.getByLabelText(/i agree to the/i)).not.toBeChecked();
//     });

//     // Verify fetch was called correctly
//     expect(global.fetch).toHaveBeenCalledTimes(1);
//     expect(global.fetch).toHaveBeenCalledWith(
//       expect.stringContaining('/datasets/create_dataset/'),
//       expect.objectContaining({
//         method: 'POST',
//         body: expect.any(FormData)
//       })
//     );
//   });











//   // test('handles server error', async () => {
//   //   const mockError = new Error('Upload failed');
//   //   (global.fetch as jest.Mock).mockRejectedValueOnce(mockError);

//   //   render(<DatasetForm />);
//   //   fillOutForm();
    
//   //   fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));

//   //   // Verify loading state appears
//   //   expect(await screen.findByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
//   //   // Verify error message appears
//   //   expect(await screen.findByText(/Upload failed/i)).toBeInTheDocument();
    
//   //   expect(global.fetch).toHaveBeenCalledTimes(1);
//   // });






//   // test('handles loading state during submission', async () => {
//   //   const mockResponse = { 
//   //     ok: true, 
//   //     json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' }) 
//   //   };
    
//   //   // Add artificial delay to mock
//   //   (global.fetch as jest.Mock).mockImplementationOnce(() => 
//   //     new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
//   //   );

//   //   render(<DatasetForm />);
//   //   fillOutForm();
    
//   //   fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
//   //   // Verify loading state
//   //   expect(await screen.findByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
//   //   // Verify success state
//   //   expect(await screen.findByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
    
//   //   // Verify button returns to normal state
//   //   await waitFor(() => {
//   //     expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
//   //   });
//   // });











// });




import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DatasetForm from '@/components/dataForm';
import * as auth from '@/libs/auth';

// Mock the auth module
jest.mock('@/libs/auth', () => ({
  fetchWithAuth: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
delete window.location;
window.location = { href: '', assign: jest.fn() };

describe('DatasetForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup mock localStorage with token
    localStorageMock.getItem.mockReturnValue('mock-token');
  });

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
    expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    // Mock successful API response
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
    });

    render(<DatasetForm />);
    fillOutForm();
    
    const submitButton = screen.getByRole('button', { name: /Upload Data/i });
    fireEvent.click(submitButton);

    // Verify loading state
    expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
    // Wait for success message to appear in the notification
    await waitFor(() => {
      const successMessage = screen.getByText(/Dataset uploaded successfully!/i);
      expect(successMessage).toBeInTheDocument();
    });

    // Verify form was reset
    await waitFor(() => {
      expect(screen.getByLabelText(/title/i)).toHaveValue('');
      expect(screen.getByLabelText(/description/i)).toHaveValue('');
      expect(screen.getByLabelText(/tags/i)).toHaveValue('');
      expect(screen.getByLabelText(/category/i)).toHaveValue('');
      expect(screen.getByLabelText(/i agree to the/i)).not.toBeChecked();
    });

    // Verify API was called correctly
    expect(auth.fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(auth.fetchWithAuth).toHaveBeenCalledWith(
      expect.stringContaining('/datasets/create_dataset/'),
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
  });

  test('handles server error correctly', async () => {
    // Mock error response
    (auth.fetchWithAuth as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Server validation failed' })
    });

    render(<DatasetForm />);
    fillOutForm();
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));

    // Wait for error message to appear
    await waitFor(() => {
      const errorMessage = screen.getByText(/Server validation failed/i);
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify form is still enabled
    expect(screen.getByRole('button', { name: /Upload Data/i })).toBeEnabled();
  });

  test('handles network error correctly', async () => {
    // Mock network error
    (auth.fetchWithAuth as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<DatasetForm />);
    fillOutForm();
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));

    // Wait for error message to appear
    await waitFor(() => {
      const errorMessage = screen.getByText(/Network error/i);
      expect(errorMessage).toBeInTheDocument();
    });

    // Verify form is still enabled
    expect(screen.getByRole('button', { name: /Upload Data/i })).toBeEnabled();
  });



  test('handles loading state during submission', async () => {
    // Mock successful API response with delay
    (auth.fetchWithAuth as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Dataset uploaded successfully!' })
      }), 100))
    );

    render(<DatasetForm />);
    fillOutForm();
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
    // Verify loading state
    expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
    // Verify success state
    expect(await screen.findByText(/Dataset uploaded successfully!/i)).toBeInTheDocument();
    
    // Verify button returns to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
    });
  });

  test('handles server error during submission', async () => {
    // Mock error response with delay
    (auth.fetchWithAuth as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server validation failed' })
      }), 100))
    );

    render(<DatasetForm />);
    fillOutForm();
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
    // Verify loading state
    expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
    // Verify error state
    expect(await screen.findByText(/Server validation failed/i)).toBeInTheDocument();
    
    // Verify button returns to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
    });
  });

  test ('handles network error during submission', async () => {
    // Mock network error with delay
    (auth.fetchWithAuth as jest.Mock).mockImplementationOnce(() => 
      new Promise((_, reject) => setTimeout(() => reject(new Error('Network error')), 100))
    );

    render(<DatasetForm />);
    fillOutForm();
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
    // Verify loading state
    expect(screen.getByText(/Uploading\.\.\./i)).toBeInTheDocument();
    
    // Verify error state
    expect(await screen.findByText(/Network error/i)).toBeInTheDocument();
    
    // Verify button returns to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Upload Data/i })).toBeInTheDocument();
    });
  });
  // test the other untested scenarios

  test('shows validation errors on submit with empty fields', async () => {
    render(<DatasetForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
    expect(await screen.findByText(/Title is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please select a category/i)).toBeInTheDocument();
    expect(await screen.findByText(/At least one tag is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please select a file to upload/i)).toBeInTheDocument();
    expect(await screen.findByText(/You must agree to the license terms/i)).toBeInTheDocument();
  });


  // test the other untested scenarios and funcs
  test('validates description length', async () => {
    render(<DatasetForm />);
    
    fillOutForm('Too short description');
    
    fireEvent.click(screen.getByRole('button', { name: /Upload Data/i }));
    
    expect(await screen.findByText(/Description is required and must be at least 100 characters/i)).toBeInTheDocument();
  });



});