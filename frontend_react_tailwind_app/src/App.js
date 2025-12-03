import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import { ApolloProvider } from '@apollo/client';
import createApolloClient from './apollo/client';
import { AuthProvider } from './auth/AuthProvider';

/**
 * PUBLIC_INTERFACE
 * App entry: sets theme attribute and provides global app providers.
 * This component WRAPS its children with ApolloProvider and AuthProvider so any routed UI
 * (including Layout/Navbar/Sidebar) has access to both contexts.
 */
function App({ children }) {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const apolloClient = useMemo(() => createApolloClient(), []);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <div className="App">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
          {children}
        </div>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default App;
