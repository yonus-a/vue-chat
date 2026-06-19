import type { Message } from "~/types/chat";

export interface UploadProgressEvent {
  uploaded: number;
  total: number;
  progress: number;
}

export interface SendMessageOptions {
  onProgress?: (e: UploadProgressEvent) => void;
}

export type AccessDecision = "approved" | "rejected";

export interface ChatActionAdapter {
  sendMessage(msg: Message, opts?: SendMessageOptions): Promise<Message>;

  editMessage(id: string, text: string): Promise<Message>;

  deleteMessages(ids: string[]): Promise<void>;

  respondToAccessRequest(
    messageId: string,
    decision: AccessDecision,
  ): Promise<void>;
}
