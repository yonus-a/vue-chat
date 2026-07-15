<script setup lang="ts">
import {
  ChatPage,
  useChatStore,
  useCallStore,
  useMessagesStore,
  useMediaStore,
} from "../../dist";

import { createMockCallHandlers } from "./mock/call";
import { createMockChatHelpers } from "./mock/conversations";
import { createMockMessagesHandlers } from "./mock/messages";
import { createMockMediaHandlers } from "./mock/media";

const chatStore = useChatStore();
const callStore = useCallStore();
const messagesStore = useMessagesStore();
const mediaStore = useMediaStore();

chatStore.setHandlers(createMockChatHelpers());
callStore.setHandlers(createMockCallHandlers());
messagesStore.setHandlers(createMockMessagesHandlers());
mediaStore.setHandlers(createMockMediaHandlers());
</script>

<template>
  <ChatPage />
</template>
