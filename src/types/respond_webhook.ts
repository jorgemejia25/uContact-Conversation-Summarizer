import { Type } from "@sinclair/typebox";

export interface WebhookRequest {
  event_type: string;
  event_id: string;
  contact: Contact;
  message: WebhookRequestMessage;
  channel: Channel;
}

export interface Channel {
  id: number;
  name: string;
  source: string;
  meta: string;
  created_at: number;
}

/**
 * Represents a contact entity with detailed information.
 *
 * @property {number} id - The unique identifier for the contact.
 * @property {string} firstName - The first name of the contact.
 * @property {string} lastName - The last name of the contact.
 * @property {string} phone - The phone number of the contact.
 * @property {null} email - The email address of the contact (currently null).
 * @property {null} language - The preferred language of the contact (currently null).
 * @property {null} profilePic - The profile picture URL of the contact (currently null).
 * @property {string} countryCode - The country code associated with the contact.
 * @property {string} status - The current status of the contact.
 * @property {Assignee} assignee - The assignee responsible for the contact.
 * @property {number} created_at - The timestamp when the contact was created.
 * @property {string} lifecycle - The lifecycle stage of the contact.
 */
export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  language: string | null;
  profilePic: string | null;
  countryCode: string;
  status: string;
  assignee: Assignee;
  created_at: number;
  lifecycle: string;
}

export interface Assignee {
  id: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

export interface WebhookRequestMessage {
  messageId: number;
  channelMessageId: string;
  contactId: number;
  channelId: number;
  traffic: string;
  timestamp: number;
  message: MessageMessage;
}

export interface MessageMessage {
  type: string;
  text: string;
}

/**
 * Schema for validating a webhook request.
 */
export const WebhookRequestSchema = Type.Object({
  event_type: Type.String({
    minLength: 1,
    description: "Type of the event being triggered",
  }),
  event_id: Type.String({
    description: "Unique identifier for the event",
  }),
  contact: Type.Object({
    id: Type.Number(),
    firstName: Type.String(),
    lastName: Type.String(),
    phone: Type.String(),
    email: Type.Union([Type.Null(), Type.String()]),
    language: Type.Union([Type.Null(), Type.String()]),
    profilePic: Type.Union([Type.Null(), Type.String()]),
    countryCode: Type.String(),
    status: Type.String(),
    assignee: Type.Object({
      id: Type.Union([Type.Null(), Type.Number()]),
      firstName: Type.Union([Type.Null(), Type.String()]),
      lastName: Type.Union([Type.Null(), Type.String()]),
      email: Type.Union([Type.Null(), Type.String()]),
    }),
    created_at: Type.Number(),
    lifecycle: Type.String(),
  }),
  message: Type.Object({
    messageId: Type.Number(),
    channelMessageId: Type.String(),
    contactId: Type.Number(),
    channelId: Type.Number(),
    traffic: Type.String(),
    timestamp: Type.Number(),
    message: Type.Object({
      type: Type.String(),
      text: Type.String(),
    }),
  }),
  channel: Type.Object({
    id: Type.Number(),
    name: Type.String(),
    source: Type.String(),
    meta: Type.String(),
    created_at: Type.Number(),
  }),
});
