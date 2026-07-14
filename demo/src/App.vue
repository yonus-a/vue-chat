<script setup lang="ts">
import {
  ChatPage,
  useChatStore,
  useCallStore,
  useMessagesStore,
} from "../../dist";
import { createMockCallHandlers } from "./mock/call";
import { createMockChatHelpers } from "./mock/conversations";
import { createMockMessagesHandlers } from "./mock/messages";

const chatStore = useChatStore();
const callStore = useCallStore();
const messagesStore = useMessagesStore();

chatStore.setHandlers(createMockChatHelpers());
callStore.setHandlers(createMockCallHandlers());
messagesStore.setHandlers(createMockMessagesHandlers());
</script>

<template>
  <ChatPage />
</template>
