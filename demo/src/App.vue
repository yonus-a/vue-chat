<script setup lang="ts">
import {
  ChatPage,
  useChatStore,
  useCallStore,
  useMessagesStore,
  useMediaStore,
} from "../../dist";

import { createMockChatHelpers } from "./mock/conversations";
import { createMockMessagesHandlers } from "./mock/messages";
import { createMockMediaHandlers } from "./mock/media";

const chatStore = useChatStore();
const messagesStore = useMessagesStore();
const mediaStore = useMediaStore();

chatStore.setHandlers(createMockChatHelpers());
messagesStore.setHandlers(createMockMessagesHandlers());
mediaStore.setHandlers(createMockMediaHandlers());
</script>

<template>
  <ChatPage />
</template>
