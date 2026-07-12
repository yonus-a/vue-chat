<script setup lang="ts">
import NoChatSelected from "../assets/lib-images/chat/no-chat-selected.webp";
import NoDataDisplay from "./general/NoDataDisplay.vue";
import { useChatStore } from "../stores/chatStore";
import ChatList from "./chat/contact/ChatList.vue";
import { useWindowSize } from "@vueuse/core";
import ChatView from "./chat/ChatView.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { width } = useWindowSize();
const chatStore = useChatStore();
const { t } = useI18n();

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
  <div class="flex w-full h-full max-h-full overflow-hidden">
    <div v-if="showMessagingSection" class="h-full flex-1 relative">
      <ChatView v-if="isInChat" />
      <div v-else class="w-full h-full flex items-center justify-center">
        <NoDataDisplay
          :image-path="NoChatSelected"
          :title="t('chat.noConversationSelected')"
        />
      </div>
    </div>

    <div
      v-if="showContactList"
      class="md:w-80 w-full h-full shrink-0 border-l border-outline-variant"
    >
      <ChatList />
    </div>
  </div>
</template>
