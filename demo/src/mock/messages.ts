export type status = "pending" | "approved" | "rejected" | "expired";
export type ServicePresence = "online" | "on-site";
export type UserRoleKey = "user" | "employee" | "business" | "support";
export type StateKeys = "" | "online" | "ended" | "active";
export type MessageType = "text" | "image" | "file" | "voice" | "video";
export interface Message {
  id: string;
  conversationId: string;
  date: Date;
  type: MessageType;
  text?: string;
  imageUrl?: string[];
  fileUrl?: string;
  voiceUrl?: string;
  videoUrl?: string;
  isEdited: boolean;
  senderId: string;
  isSent: boolean;
  isRead: boolean;
  repliedTo?: Message;
  request?: string;
}

export interface Contact {
  id: string;
  name: string;
  lastName: string;
  isOnline: boolean;
  lastSeen: Date;
  imageUrl: string;
  nationalCode?: string;
  phoneNumber?: string;
  isActive: boolean;
  birthDate: Date;
  lastMessage?: Message;
  unreadCount?: number;
  serviceType?: "video-call" | "voice-call" | "chat";
  userType: UserRoleKey[];
}

export interface ChatFilter {
  key: StateKeys;
  label: string;
}

export interface ExtendedMessage extends Message {
  prevMessage?: Message;
  nextMessage?: Message;
  isFirstInDate: boolean;
  contact?: Contact;
}

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

// ============= SEED-BASED RANDOM =============
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return this.seed / 2147483647;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

// ============= DATA POOLS =============
const TEXT_MESSAGES = [
  "سلام، وقت بخیر",
  "ممنون بابت پیگیری",
  "بله، مشکلی نیست",
  "لطفاً زمان بیشتری بدید",
  "فایل رو فرستادم، چک کنید",
  "جلسه فردا سر ساعت ۱۰ برگزار میشه",
  "آیا امکان تغییر زمان وجود داره؟",
  "پروژه آماده است و میتونید بررسی کنید",
  "لطفاً صورت‌حساب رو ارسال کنید",
  "با تشکر از همکاری خوبتون",
  "سلام، وضعیت سفارش من چیه؟",
  "من منتظر پاسخ شما هستم",
  "آیا این محصول موجود هست؟",
  "قیمت نهایی چقدر میشه؟",
  "لطفاً آدرس رو بفرستید",
  "مورد تایید شد",
  "نیاز به revision بیشتری داره",
  "خسته نباشید",
  "ممنون، عالی بود",
  "فردا تماس میگیرم",
] as const;

const IMAGE_URLS = [
  "https://picsum.photos/seed/img1/400/300",
  "https://picsum.photos/seed/img2/400/300",
  "https://picsum.photos/seed/img3/400/300",
] as const;

const FILE_NAMES = [
  "report.pdf",
  "invoice.xlsx",
  "contract.docx",
  "design.fig",
] as const;

// ============= IN-MEMORY DB =============
// Stores messages per conversation so edits/deletes persist during the session
const messageDB = new Map<string, Message[]>();

// ============= GENERATORS =============

function generateMessage(
  rng: SeededRandom,
  conversationId: string,
  senderId: string,
  date: Date
): Message {
  const typeRoll = rng.next();

  const base: Message = {
    id: `msg-${conversationId}-${rng.nextInt(10000, 99999)}`,
    conversationId,
    date,
    type: "text",
    isEdited: false,
    senderId,
    isSent: senderId === "me", // Assume "me" is the current user
    isRead: rng.next() < 0.6,
  };

  if (typeRoll < 0.65) {
    base.type = "text";
    base.text = rng.pick(TEXT_MESSAGES);
  } else if (typeRoll < 0.8) {
    base.type = "image";
    base.imageUrl = [rng.pick(IMAGE_URLS)];
    base.text = "این عکس رو ببینید";
  } else if (typeRoll < 0.9) {
    base.type = "file";
    const fileName = rng.pick(FILE_NAMES);
    base.fileUrl = `https://example.com/files/${fileName}`;
    base.text = `فایل ${fileName}`;
  } else if (typeRoll < 0.95) {
    base.type = "voice";
    base.voiceUrl = "https://example.com/voice/msg.mp3";
  } else {
    base.type = "video";
    base.videoUrl = "https://example.com/video/msg.mp4";
  }

  return base;
}

function getOrCreateConversationMessages(conversationId: string): Message[] {
  if (!messageDB.has(conversationId)) {
    const seed = parseInt(conversationId.replace(/\D/g, "") || "0", 10);
    const rng = new SeededRandom(seed + 54321);
    const totalMessages = rng.nextInt(30, 80);
    const messages: Message[] = [];
    const now = new Date();

    for (let i = 0; i < totalMessages; i++) {
      const minutesAgo = (totalMessages - i) * rng.nextInt(5, 120);
      const date = new Date(now.getTime() - minutesAgo * 60 * 1000);
      const senderId = rng.next() < 0.5 ? "me" : conversationId;
      
      messages.push(generateMessage(rng, conversationId, senderId, date));
    }

    // Sort chronologically
    messages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    messageDB.set(conversationId, messages);
  }

  return messageDB.get(conversationId)!;
}

// ============= MOCK HANDLERS =============

export function createMockMessagesHandlers(): MessagesHandlers {
  return {
    /**
     * Fetch messages with 0-indexed pagination.
     * Returns oldest first (chronological order for chat UI).
     */
    async fetchMessages(params: FetchMessagesParams): Promise<Message[]> {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

      const { conversationId, page, pageSize } = params;
      const allMessages = getOrCreateConversationMessages(conversationId);

      // 1-indexed pagination matching messagesStore; page 1 is newest slice,
      // page N+1 prepends older messages.
      const total = allMessages.length;
      const end = total - (page - 1) * pageSize;
      const start = end - pageSize;

      if (start >= total || end <= 0) {
        return [];
      }

      const safeStart = Math.max(0, start);
      const safeEnd = Math.min(total, end);

      return allMessages.slice(safeStart, safeEnd);
    },

    /**
     * Send a new message.
     * Simulates upload progress for media files.
     */
    async sendMessage(
      msg: Message,
      opts?: SendMessageOptions
    ): Promise<Message> {
      const isMedia =
        msg.type === "image" ||
        msg.type === "file" ||
        msg.type === "voice" ||
        msg.type === "video";

      // Simulate upload progress if it's a media file
      if (isMedia && opts?.onProgress) {
        const totalSteps = 10;
        for (let i = 1; i <= totalSteps; i++) {
          await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
          const uploaded = i * 10;
          const progressEvent: UploadProgressEvent = {
            uploaded,
            total: 100,
            progress: uploaded,
          };
          opts.onProgress(progressEvent);
        }
      } else {
        // Standard network delay for text
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
      }

      // Create the final message object
      const sentMessage: Message = {
        ...msg,
        id: msg.id || `msg-new-${Date.now()}`,
        date: msg.date || new Date(),
        isSent: true,
        isRead: false,
        isEdited: false,
      };

      // Add to in-memory DB
      const messages = getOrCreateConversationMessages(msg.conversationId);
      messages.push(sentMessage);

      return sentMessage;
    },

    /**
     * Edit an existing text message.
     */
    async editMessage(id: string, text: string): Promise<Message> {
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));

      // Find the message across all conversations
      let targetMsg: Message | undefined;
      for (const messages of messageDB.values()) {
        targetMsg = messages.find((m) => m.id === id);
        if (targetMsg) break;
      }

      if (!targetMsg) {
        throw new Error(`Message with id "${id}" not found for editing.`);
      }

      // Update and return
      targetMsg.text = text;
      targetMsg.isEdited = true;

      return { ...targetMsg };
    },

    /**
     * Delete one or more messages.
     */
    async deleteMessages(ids: string[]): Promise<void> {
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 150));

      const idsSet = new Set(ids);

      // Remove from all conversations
      for (const messages of messageDB.values()) {
        const initialLength = messages.length;
        const filtered = messages.filter((m) => !idsSet.has(m.id));
        
        // Only update if something was actually deleted
        if (filtered.length < initialLength) {
          messages.length = 0;
          messages.push(...filtered);
        }
      }
    },
  };
}

// ============= USAGE EXAMPLE =============

/*
import { createMessages } from "~/providers/messages";
import { createMockMessagesHandlers } from "./mock-messages";

const mockHandlers = createMockMessagesHandlers();

createMessages({
  handlers: mockHandlers,
});
*/