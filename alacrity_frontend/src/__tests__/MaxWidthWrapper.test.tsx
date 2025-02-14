import React from 'react';
import { render, screen } from '@testing-library/react';
import MaxWidthWrapper from '@/components/MaxWidthWrapper';

describe('MaxWidthWrapper Component', () => {
  test('renders children correctly', () => {
    render(
      <MaxWidthWrapper>
        <p>Test Content</p>
      </MaxWidthWrapper>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('applies default styling', () => {
    const { container } = render(
      <MaxWidthWrapper>
        <p>Test Content</p>
      </MaxWidthWrapper>
    );
    expect(container.firstChild).toHaveClass('mx-auto w-full max-w-screen-xl px-2.5 md:px-20');
  });
});
