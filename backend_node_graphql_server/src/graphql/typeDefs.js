import { gql } from 'graphql-tag';

/**
 * PUBLIC_INTERFACE
 * GraphQL type definitions for core entities, authentication, and operations.
 * Includes: User, Event, Registration, Message types, AuthPayload, Queries/Mutations/Subscriptions.
 */
export const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    name: String
    email: String!
    avatarUrl: String
    role: String
    createdAt: String
    updatedAt: String
  }

  type Event {
    id: ID!
    title: String!
    description: String
    location: String
    type: String
    date: String
    startDate: String
    endDate: String
    imageUrl: String
    tags: [String!]
    organizer: User!
    createdAt: String
    updatedAt: String
    attendeesCount: Int
    myRsvp: String
  }

  type Registration {
    id: ID!
    event: Event!
    user: User!
    status: String
    notes: String
    createdAt: String
    updatedAt: String
  }

  type Message {
    id: ID!
    roomId: ID!
    event: Event
    user: User!
    text: String!
    createdAt: String
    updatedAt: String
  }

  type DashboardSummary {
    totalEvents: Int!
    totalRegistrations: Int!
    revenue: Float!
    activeUsers: Int!
    recentEvents: [Event!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input CreateEventInput {
    title: String!
    description: String
    location: String
    type: String
    date: String
    startDate: String
    endDate: String
    imageUrl: String
    tags: [String!]
  }

  input UpdateEventInput {
    title: String
    description: String
    location: String
    type: String
    date: String
    startDate: String
    endDate: String
    imageUrl: String
    tags: [String!]
  }

  input RegisterInput {
    name: String
    email: String!
    password: String!
  }

  type EventUpdatedPayload {
    action: String!
    id: ID!
    event: Event
  }

  type Query {
    me: User
    events(query: String, type: String, afterDate: String, limit: Int, offset: Int): [Event!]!
    event(id: ID!): Event
    dashboardSummary: DashboardSummary!
    chatMessages(roomId: ID!, limit: Int, offset: Int): [Message!]!
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event!
    updateEvent(id: ID!, input: UpdateEventInput!): Event!
    deleteEvent(id: ID!): Boolean!
    rsvp(eventId: ID!, status: String!): Event!
    register(input: RegisterInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    sendMessage(roomId: ID!, text: String!): Message!
  }

  type Subscription {
    eventUpdated: EventUpdatedPayload!
    messageAdded(roomId: ID!): Message!
  }
`;

export default typeDefs;
