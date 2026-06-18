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
