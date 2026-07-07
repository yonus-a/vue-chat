import "./assets/css/main.css";

export { default as ChatPage } from "./components/ChatPage.vue";

export { BehayandChat } from "./install";
export type { BehayandChatOptions, AppStores } from "./install";

export type {
  HostAdapter,
  ChatAdapter,
  ChatActionAdapter,
  ServiceAdapter,
  MedicationAdapter,
  FetchContactsParams,
  ContactsPage,
  FetchMessagesParams,
  UploadProgressEvent,
  SendMessageOptions,
  AccessDecision,
  FetchProvidersParams,
  ProvidersPage,
} from "./adapter";

export { createMockAdapter } from "./adapter/mock";
export { provideChatAdapter } from "./providers/chatProviders";
export { useChatPushPort } from "./adapter/PushPort";
export type { ChatPushPort } from "./adapter/PushPort";

export type { CallAdapter, CallSignalEvent, CallKind } from "./adapter";

export { useChatStore } from "./stores/chatStore";
