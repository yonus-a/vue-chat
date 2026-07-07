import { inject, provide, type InjectionKey } from "vue";
import { ChatProvider } from "~/types/chat";

const CHAT_ADAPTER: InjectionKey<ChatProvider> = Symbol("chat_adapter");

export function provideChatAdapter(config: ChatProvider) {
  provide(CHAT_ADAPTER, config);
}

export function useChatAdapter() {
  const adapter = inject(CHAT_ADAPTER);
  if (!adapter) {
    throw new Error(
      "useChatAdapter() called without provideChatAdapter() in an ancestor",
    );
  }
  return adapter;
}
