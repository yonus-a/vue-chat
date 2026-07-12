import type { Message } from "~/types/chat";

export interface UploadProgressEvent {
  uploaded: number;
  total: number;
  progress: number;
}

export interface SendMessageOptions {
  onProgress?: (e: UploadProgressEvent) => void;
}

export interface FetchMessagesParams {
  conversationId: string;
  page: number;
  pageSize: number;
}

export interface MessagesHandlers {
  sendMessage(msg: Message, opts?: SendMessageOptions): Promise<Message>;
  editMessage(id: string, text: string): Promise<Message>;
  deleteMessages(ids: string[]): Promise<void>;
  fetchMessages(params: FetchMessagesParams): Promise<Message[]>;
}

let handlers: MessagesHandlers | null = null;

export function createMessages(config: { handlers: MessagesHandlers }) {
  handlers = config.handlers;
}

export function getMessagesHandlers(): MessagesHandlers {
  if (!handlers) {
    throw new Error(
      "Messages is not initialized. Call createMessages() before using the message store."
    );
  }

  return handlers;
}