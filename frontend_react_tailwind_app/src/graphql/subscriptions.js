import { gql } from '@apollo/client';
import { EVENT_FIELDS, MESSAGE_FIELDS } from './fragments';

/**
 * PUBLIC_INTERFACE
 * Subscription: Event updates (created/updated/deleted)
 */
export const EVENT_UPDATED_SUB = gql`
  subscription OnEventUpdated {
    eventUpdated {
      action
      event {
        ...EventFields
      }
      id
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Subscription: Chat messages in a room
 */
export const MESSAGE_ADDED_SUB = gql`
  subscription OnMessageAdded($roomId: ID!) {
    messageAdded(roomId: $roomId) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
