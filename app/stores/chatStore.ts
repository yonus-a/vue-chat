import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", () => {
  const activeConversationId = ref<string | null>();
  const currentUserId = ref<string | null>();

  const setSelectedChat = (id: string) => {
    activeConversationId.value = id;
  };

  return {
    activeConversationId,
    setSelectedChat,
    currentUserId,
  };
});
