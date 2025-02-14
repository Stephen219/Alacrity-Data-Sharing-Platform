import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from '@/components/Layout';

jest.mock('@/components/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="mock-navbar">Mock Navbar</div>;
  };
});

jest.mock('@/components/Sidebar', () => {
  return function MockSidebar({ isOpen }: { isOpen: boolean }) {
    return <div data-testid="mock-sidebar">Mock Sidebar: {isOpen ? 'open' : 'closed'}</div>;
  };
});

describe('Layout', () => {
  it('renders layout with navbar and sidebar', () => {
    const { getByTestId } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(getByTestId('mock-navbar')).toBeInTheDocument();
    expect(getByTestId('mock-sidebar')).toBeInTheDocument();
  });

  it('renders children content', () => {
    const { getByText } = render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });
});