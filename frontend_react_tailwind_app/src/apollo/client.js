import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

/**
 * Apollo Client factory with HTTP and WebSocket split links.
 * - HTTP: queries/mutations to REACT_APP_BACKEND_URL/graphql
 * - WS: subscriptions to REACT_APP_WS_URL/graphql
 * - Includes auth header using token from localStorage (if present).
 */

// PUBLIC_INTERFACE
export const createApolloClient = () => {
  const httpUrl = `${process.env.REACT_APP_BACKEND_URL?.replace(/\/$/, '')}/graphql`;
  const wsUrl = `${process.env.REACT_APP_WS_URL?.replace(/\/$/, '')}/graphql`;

  // Attach Authorization header from localStorage for HTTP requests
  const authHttpLink = new HttpLink({
    uri: httpUrl,
    headers: {
      // Token format expected: "Bearer <jwt>"
      Authorization: (() => {
        try {
          const token = localStorage.getItem('auth_token');
          return token ? `Bearer ${token}` : '';
        } catch {
          return '';
        }
      })(),
    },
  });

  // WebSocket link for subscriptions (only if ws env provided)
  const wsLink =
    wsUrl && typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: wsUrl,
            connectionParams: () => {
              try {
                const token = localStorage.getItem('auth_token');
                return token ? { Authorization: `Bearer ${token}` } : {};
              } catch {
                return {};
              }
            },
            lazy: true,
            retryAttempts: 5,
          })
        )
      : null;

  // Split link based on operation type (subscription -> ws, else -> http)
  const link =
    wsLink != null
      ? split(
          ({ query }) => {
            const def = getMainDefinition(query);
            return def.kind === 'OperationDefinition' && def.operation === 'subscription';
          },
          wsLink,
          authHttpLink
        )
      : authHttpLink;

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
    // New Apollo devtools integration option replaces deprecated connectToDevTools
    devtools: {
      // Use standard NODE_ENV to align with CRA and Apollo tooling
      enabled: process.env.NODE_ENV !== 'production',
    },
  });

  return client;
};

export default createApolloClient;
