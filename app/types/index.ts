export type ThemeMode = "light" | "dark";

export interface CallMember extends Contact {
  stream: MediaStream | null;
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
}

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

export interface ChatProvider {
  fetchContacts: () => Promise<Contact[]>;
}

export type CallKind = "voice-call" | "video-call";

export type CallSignalEvent =
  | { type: "offer"; callId: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; callId: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; callId: string; candidate: RTCIceCandidateInit }
  | { type: "end"; callId: string }
  | { type: "join"; callId: string; memberId: string }
  | { type: "leave"; callId: string; memberId: string };

export interface CallHandlers {
  initiate(conversationId: string, kind: CallKind): Promise<{ callId: string }>;
  sendOffer(callId: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  sendAnswer(callId: string, sdp: RTCSessionDescriptionInit): Promise<void>;
  sendIce(callId: string, candidate: RTCIceCandidateInit): Promise<void>;
  end(callId: string): Promise<void>;
  onSignal(handler: (e: CallSignalEvent) => void): () => void;
}

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

export interface MediaDownloadOptions {
  signal?: AbortSignal;
  onProgress?: (percent: number) => void;
}

export interface MediaHandlers {
  download(url: string, opts?: MediaDownloadOptions): Promise<Blob>;
  getFileSize(url: string): Promise<number | null>;
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

export interface FetchProfileAttachmentsParams {
  conversationId: string;
  page: number;
  pageSize: number;
}

export interface ProfileAttachmentsPage {
  data: string[];
  hasNextPage: boolean;
}

export interface ProfileHandlers {
  fetchMedia(params: FetchProfileAttachmentsParams): Promise<ProfileAttachmentsPage>;
  fetchFiles(params: FetchProfileAttachmentsParams): Promise<ProfileAttachmentsPage>;
}
