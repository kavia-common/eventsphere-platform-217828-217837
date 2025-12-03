import { gql } from '@apollo/client';

/**
 * PUBLIC_INTERFACE
 * Common GraphQL fragments reused across queries and mutations.
 */

// PUBLIC_INTERFACE
export const EVENT_FIELDS = gql`
  fragment EventFields on Event {
    id
    title
    description
    location
    type
    date
    imageUrl
    tags
    createdAt
    updatedAt
    organizer {
      id
      name
      email
    }
    attendeesCount
    myRsvp
  }
`;

// PUBLIC_INTERFACE
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    name
    email
    avatarUrl
    createdAt
  }
`;

// PUBLIC_INTERFACE
export const MESSAGE_FIELDS = gql`
  fragment MessageFields on Message {
    id
    text
    createdAt
    user {
      id
      name
      email
    }
  }
`;
