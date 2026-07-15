<script setup lang="ts">
import NoChatSelected from "../assets/lib-images/chat/no-chat-selected.webp";
import NoDataDisplay from "./general/NoDataDisplay.vue";
import useLocalI18n from "~/composables/useLocalI18n";
import { useChatStore } from "../stores/chatStore";
import ChatList from "./chat/contact/ChatList.vue";
import ChatView from "./chat/ChatView.vue";
import { chatPage } from "@i18n/locales";
import { computed } from "vue";

const { width } = useWindowSize();
const chatStore = useChatStore();
const { t } = useLocalI18n(chatPage);

const isMobile = computed(() => width.value < 768);
const isInChat = computed(() => chatStore.activeConversationId !== null);

const showContactList = computed(() => {
  if (isMobile.value) return !isInChat.value;
  return true;
});

const showMessagingSection = computed(() => {
  if (isMobile.value) return isInChat.value;
  return true;
});
</script>
<template>
  <div
    class="flex w-full h-full max-h-full overflow-hidden font-chat-family text-chat-base text-chat-on-background bg-chat-background"
  >
    <div v-if="showMessagingSection" class="h-full flex-1 relative">
      <ChatView v-if="isInChat" />
      <div v-else class="w-full h-full flex items-center justify-center">
        <NoDataDisplay
          :image-path="NoChatSelected"
          :title="t('noConversationSelected')"
        />
      </div>
    </div>

    <div
      v-if="showContactList"
      class="md:w-80 w-full h-full shrink-0 border-l border-chat-outline-variant"
    >
      <ChatList />
    </div>
  </div>
</template>
