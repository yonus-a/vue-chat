<template>
    <div class="flex w-full h-full max-h-full overflow-hidden">
        <div v-if="showMessagingSection" class="h-full flex-1 relative">
            <ChatView v-if="isInChat" />
            <div v-else class=" w-full h-full flex items-center justify-center ">
                <NoDataDisplay :image-path="NoChatSelected" :title="t('chat.noConversationSelected')" />
            </div>
        </div>

        <div v-if="showContactList" class="md:w-80 w-full h-full shrink-0 border-l border-outline-variant">
            <ChatList />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, type DefineComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWindowSize } from '@vueuse/core';
import { useChatStore } from '../stores/chatStore';
import NoDataDisplay from './general/NoDataDisplay.vue';
import NoChatSelected from '../assets/lib-images/chat/no-chat-selected.webp';
import ChatList from './chat/contact/ChatList.vue';
import ChatView from './chat/ChatView.vue';

const ChatPage = defineComponent({
    name: 'ChatPage',
    components: {
        ChatList,
        ChatView,
        NoDataDisplay,
    },
    setup() {
        const { width } = useWindowSize();
        const { t } = useI18n();
        const chatStore = useChatStore();

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

        return {
            isInChat,
            isMobile,
            showContactList,
            showMessagingSection,
            NoChatSelected,
            t,
        };
    },
});

// Cast at the export boundary so vue-tsc widens the public type and stops
// inferring private types from descendants (ChatView -> PrescribtionDisplay
// etc.) — that inference is what was tripping TS4082 during .d.ts emit.
export default ChatPage as unknown as DefineComponent<{}, {}, any>;
</script>
