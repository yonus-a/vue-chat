import type { Service } from "./service";
import type { Provider } from "./service";
import type { Invoice } from "./invoice";
export type MessageType = "text" | "image" | "file" | "voice" | "video";
export type status = "pending" | "approved" | "rejected" | "expired";
export type ServicePresence = "online" | "on-site";
export type UserRoleKey = "user" | "employee" | "business" | "support";

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
  repliedTo: Message;
  request?: Request;
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

export type FilterKeys = "" | "online" | "ended" | "active";

export interface ChatFilter {
  key: FilterKeys;
  label: string;
}

export interface ExtendedMessage extends Message {
  prevMessage?: Message;
  nextMessage?: Message;
  isFirstInDate: boolean;
  contact?: Contact;
}

export interface Request {
  id: string;
  type: "personal-info" | "add-person";
  request: AccessRequest | ServiceRequest;
}

export interface AccessRequest {
  id: string;
  date: Date;
  status: status;
}

export interface RequestProvider extends Provider {
  status: "pending" | "approved" | "payment" | "rejected" | "expired";
}

export interface ServiceRequest extends Service {
  status?:
    | "searching"
    | "pending"
    | "approved"
    | "payment"
    | "rejected"
    | "expired";
  provider?: RequestProvider[];
  service?: Service;
  serviceType?: ServicePresence;
  invoice?: Invoice;
}

export interface ChatProvider {
  fetchContacts: () => Promise<Contact[]>
}