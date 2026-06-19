import type {
  ChatActionAdapter,
  SendMessageOptions,
  AccessDecision,
} from "../ports/ChatActionAdapter";
import type { Message } from "~/types/chat";
import { delay, randomId } from "~/mock";

export interface MockChatActionAdapterOptions {
  latencyMs?: number;
  uploadDurationMs?: number;
  uploadTicks?: number;
  cacheUploadsInIndexedDb?: boolean;
}

const sizeForType = (type: Message["type"]): number => {
  if (type === "video") return 1024 * 1024 * 15;
  if (type === "file") return 1024 * 1024 * 5;
  if (type === "voice") return 1024 * 1024 * 2;
  if (type === "image") return 1024 * 1024 * 2;
  return 0;
};

const cacheToIndexedDb = async (msg: Message): Promise<void> => {
  if (typeof indexedDB === "undefined") return;
  const dbName = "ChatFileCache";
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("files");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  const tx = db.transaction("files", "readwrite");
  const mockBlob = new Blob(["mock content"], {
    type: "application/octet-stream",
  });
  const urls = [
    msg.fileUrl,
    msg.voiceUrl,
    msg.videoUrl,
    ...(msg.imageUrl || []),
  ].filter(Boolean) as string[];
  urls.forEach((url) => tx.objectStore("files").put(mockBlob, url));
};

export const createMockChatActionAdapter = (
  opts: MockChatActionAdapterOptions = {},
): ChatActionAdapter => {
  const {
    latencyMs = 1000,
    uploadDurationMs = 2500,
    uploadTicks = 10,
    cacheUploadsInIndexedDb = true,
  } = opts;

  return {
    async sendMessage(
      msg: Message,
      sendOpts: SendMessageOptions = {},
    ): Promise<Message> {
      const total = sizeForType(msg.type);
      const isUpload = total > 0;

      if (isUpload && sendOpts.onProgress) {
        const tickMs = uploadDurationMs / uploadTicks;
        const chunk = total / uploadTicks;
        await new Promise<void>((resolve) => {
          let uploaded = 0;
          const id = setInterval(() => {
            uploaded += chunk;
            if (uploaded >= total) {
              clearInterval(id);
              sendOpts.onProgress!({
                uploaded: total,
                total,
                progress: 100,
              });
              resolve();
            } else {
              sendOpts.onProgress!({
                uploaded,
                total,
                progress: Math.round((uploaded / total) * 100),
              });
            }
          }, tickMs);
        });
      } else {
        await delay(latencyMs);
      }

      if (isUpload && cacheUploadsInIndexedDb) {
        try {
          await cacheToIndexedDb(msg);
        } catch (e) {
          console.warn("MockChatActionAdapter: IDB cache failed", e);
        }
      }

      return { ...msg, id: randomId(), isSent: true };
    },

    async editMessage(id: string, text: string): Promise<Message> {
      await delay(latencyMs);
      return {
        id,
        conversationId: "0",
        date: new Date(),
        type: "text",
        text,
        isEdited: true,
        senderId: "0",
        isSent: true,
        isRead: false,
      } as Message;
    },

    async deleteMessages(_ids: string[]): Promise<void> {
      await delay(latencyMs);
    },

    async respondToAccessRequest(
      _messageId: string,
      _decision: AccessDecision,
    ): Promise<void> {
      await delay(latencyMs * 1.5);
    },
  };
};
