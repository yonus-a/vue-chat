import type {
  ChatAdapter,
  FetchContactsParams,
  ContactsPage,
  FetchMessagesParams,
} from "../ports/ChatAdapter";
import type { Message } from "~/types/chat";
import { seedContacts, seedMessages, delay } from "~/mock";

export interface MockChatAdapterOptions {
  latencyMs?: number;
  currentUserId?: string;
}

export const createMockChatAdapter = (
  opts: MockChatAdapterOptions = {},
): ChatAdapter => {
  const { latencyMs = 400, currentUserId = "1" } = opts;

  return {
    async fetchContacts(params: FetchContactsParams): Promise<ContactsPage> {
      await delay(latencyMs);
      return seedContacts({ ...params, currentUserId });
    },

    async fetchMessages(params: FetchMessagesParams): Promise<Message[]> {
      await delay(latencyMs);
      return seedMessages({ ...params, currentUserId });
    },

    async markRead(_conversationId: number): Promise<void> {
      // no-op
    },
  };
};
