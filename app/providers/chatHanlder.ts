import type { Contact, StateKeys } from "~/types/chat";

export interface FetchContactsParams {
  page: number;
  pageSize: number;
  state: StateKeys;
  search?: string;
}

export interface ContactsPage {
  data: Contact[];
  hasNextPage: boolean;
}

export interface ChatHandlers {
  fetchConversations(params: FetchContactsParams): Promise<ContactsPage>;
  deleteConversation(id: string): Promise<void>;
}

let handlers: ChatHandlers | null = null;

export function createChat(config: { handlers: ChatHandlers }) {
  handlers = config.handlers;
}

export function getChatHandlers(): ChatHandlers {
  if (!handlers) {
    throw new Error(
      "Chat is not initialized. Call createChat() before using useChatStore().",
    );
  }

  return handlers;
}
