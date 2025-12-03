import { gql } from '@apollo/client';
import { EVENT_FIELDS, USER_FIELDS, MESSAGE_FIELDS } from './fragments';

/**
 * PUBLIC_INTERFACE
 * Mutation: Create event
 */
export const CREATE_EVENT_MUTATION = gql`
  mutation CreateEvent($input: CreateEventInput!) {
    createEvent(input: $input) {
      ...EventFields
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: Update event
 */
export const UPDATE_EVENT_MUTATION = gql`
  mutation UpdateEvent($id: ID!, $input: UpdateEventInput!) {
    updateEvent(id: $id, input: $input) {
      ...EventFields
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: Delete event
 */
export const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($id: ID!) {
    deleteEvent(id: $id)
  }
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: RSVP to event
 */
export const RSVP_EVENT_MUTATION = gql`
  mutation RsvpEvent($eventId: ID!, $status: String!) {
    rsvp(eventId: $eventId, status: $status) {
      ...EventFields
    }
  }
  ${EVENT_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: Register new user
 */
export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: Login and return token
 */
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        ...UserFields
      }
    }
  }
  ${USER_FIELDS}
`;

/**
 * PUBLIC_INTERFACE
 * Mutation: Send chat message
 */
export const SEND_MESSAGE_MUTATION = gql`
  mutation SendMessage($roomId: ID!, $text: String!) {
    sendMessage(roomId: $roomId, text: $text) {
      ...MessageFields
    }
  }
  ${MESSAGE_FIELDS}
`;
