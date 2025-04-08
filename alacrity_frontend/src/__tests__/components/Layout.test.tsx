import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '@/components/Layout';
import { act } from 'react-dom/test-utils';

// Mock Next.js navigation hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard', // Mock a path that should show sidebar
}));

// Mock your auth lib
jest.mock('@/libs/auth', () => ({
  fetchUserData: jest.fn().mockResolvedValue({ id: '1', name: 'Test User' }),
}));

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar({ isOpen }) {
    return <div data-testid="mock-sidebar">Mock Sidebar: {isOpen ? 'open' : 'closed'}</div>;
  };
});

describe('Layout', () => {
  it('renders layout with navbar and sidebar', async () => {
    let renderResult;
    
    // Wrap in act to handle the async state updates
    await act(async () => {
      renderResult = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );
    });
    
    const { getByTestId } = renderResult;
    expect(getByTestId('mock-navbar')).toBeInTheDocument();
    expect(getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  it('renders children content', async () => {
    let renderResult;
    
    await act(async () => {
      renderResult = render(
        <Layout>
          <div>Test Content</div>
        </Layout>
      );
    });
    
    const { getByText } = renderResult;
    expect(getByText('Test Content')).toBeInTheDocument();
  });
});