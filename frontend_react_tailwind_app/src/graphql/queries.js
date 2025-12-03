import { gql } from '@apollo/client';
import { EVENT_FIELDS, USER_FIELDS, MESSAGE_FIELDS } from './fragments';

/**
 * PUBLIC_INTERFACE
 * Query: Current authenticated user
 */
export const ME_QUERY = gql`
  query Me {
    me {
      ...UserFields
    }
  }
  ${USER_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Query: Paginated/browse events list with optional filters
 */
export const EVENTS_BROWSE_QUERY = gql`
  query EventsBrowse($query: String, $type: String, $afterDate: String, $limit: Int, $offset: Int) {
    events(query: $query, type: $type, afterDate: $afterDate, limit: $limit, offset: $offset) {
      ...EventFields
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Query: Single event by id
 */
export const EVENT_BY_ID_QUERY = gql`
  query EventById($id: ID!) {
    event(id: $id) {
      ...EventFields
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Query: Dashboard aggregates for the current user
 */
export const DASHBOARD_SUMMARY_QUERY = gql`
  query DashboardSummary {
    dashboardSummary {
      totalEvents
      totalRegistrations
      revenue
      activeUsers
      recentEvents {
        ...EventFields
      }
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Query: Chat messages for a room
 */
export const CHAT_MESSAGES_QUERY = gql`
  query ChatMessages($roomId: ID!, $limit: Int, $offset: Int) {
    chatMessages(roomId: $roomId, limit: $limit, offset: $offset) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
