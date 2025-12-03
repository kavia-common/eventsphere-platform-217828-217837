import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

/**
 * Apollo Client factory with HTTP and WebSocket split links.
 * - HTTP: queries/mutations to <httpBase>/graphql
 * - WS: subscriptions to <wsBase>/graphql
 * - Includes auth header using token from localStorage (if present).
 */

// PUBLIC_INTERFACE
export const createApolloClient = () => {
  // Normalize a base URL and ensure it points exactly to /graphql (only once).
  const withGraphqlPath = (base) => {
    if (!base) return undefined;
    // Remove trailing slashes
    let trimmed = base.replace(/\/+$/, '');
    // If the base already includes /graphql, strip any trailing segments after it
    const idx = trimmed.indexOf('/graphql');
    if (idx !== -1) {
      return trimmed.slice(0, idx + '/graphql'.length);
    }
    return `${trimmed}/graphql`;
  };

  // Prefer a single API base if provided, else use specific ones
  const apiBase = process.env.REACT_APP_API_BASE;
  let httpBase = process.env.REACT_APP_BACKEND_URL || apiBase;
  let wsBase = process.env.REACT_APP_WS_URL || apiBase;

  // If frontend is served via https and wsBase mistakenly uses ws://, upgrade to wss:// to avoid mixed content.
  try {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && wsBase?.startsWith('ws://')) {
      wsBase = wsBase.replace(/^ws:\/\//, 'wss://');
    }
    // If httpBase is http while frontend is https, advise in console (CORS/mixed content)
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && httpBase?.startsWith('http://')) {
      // eslint-disable-next-line no-console
      console.warn('[apollo] Frontend is https but REACT_APP_BACKEND_URL is http. Use https backend to avoid mixed content.');
    }
  } catch {
    // ignore
  }

  const httpUrl = withGraphqlPath(httpBase);
  const wsUrl = withGraphqlPath(wsBase);

  // Lightweight runtime diagnostics to help troubleshoot network issues in previews
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[apollo] HTTP URL:', httpUrl);
    // eslint-disable-next-line no-console
    console.debug('[apollo] WS URL:', wsUrl);
  }

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
    devtools: {
      enabled: process.env.NODE_ENV !== 'production',
    },
  });

  return client;
};

export default createApolloClient;
