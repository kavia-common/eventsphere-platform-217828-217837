import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';
import App from './App';
import router from './router';

test('renders Home route within providers without AuthProvider error', async () => {
  // If providers are misordered, useAuth would throw here when Navbar renders.
  render(
    <App>
      <RouterProvider router={router} />
    </App>
  );

  // Assert a known element from the HomePage renders
  const heading = await screen.findByText(/Home/i);
  expect(heading).toBeInTheDocument();
});
