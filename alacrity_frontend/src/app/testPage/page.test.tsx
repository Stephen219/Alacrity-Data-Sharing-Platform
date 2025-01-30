import { render, screen } from '@testing-library/react';
import FormPage from './page';

test('renders FormPage', () => {
  render(<FormPage />);


  expect(screen.getByText(/Submit a Form/i)).toBeInTheDocument();
});
