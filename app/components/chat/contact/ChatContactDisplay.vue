<template>
    <div @click="openChat" :class="[isActive ? 'bg-surface-variant' : 'bg-surface-variant/0']"
        class="rounded-xl w-full transition-all duration-200 ease-in-out cursor-pointer p-2.5 flex justify-between gap-x-3 items-center h-19">

        <div v-loading="isLoading" class="relative shrink-0 h-11 w-11">
            <ContactAvatar :contact="contact" />
        </div>

        <div class="select-none flex-1 overflow-hidden">
            <div class="w-full flex items-center justify-between">
                <div class="text-label-md text-on-surface min-w-20 truncate" v-loading="isLoading">{{ contact.name }} {{
                    contact.lastName }}</div>
                <div v-if="contact.lastMessage" class="flex gap-x-1.5 items-center shrink-0">
                    <div v-loading="isLoading" class="text-on-surface/50 text-[11px]">{{
                        formatRelativeDate(contact.lastMessage.date) }}</div>
                    <BIcon v-if="lastMessageIcon.icon !== ''" :icon="lastMessageIcon.icon"
                        :class="lastMessageIcon.color" class="w-4 h-4" />
                </div>
            </div>

            <div class="w-full flex items-center justify-between mt-0.5">
                <div class="flex items-center gap-x-1.5 flex-1 overflow-hidden">
                    <BIcon v-if="attachmentIcon && contact.lastMessage" weight="bold" :icon="attachmentIcon"
                        class="w-4 h-4 fill-primary shrink-0" />

                    <div v-loading="isLoading" v-if="contact.lastMessage"
                        :class="['max-w-full truncate text-body-sm transition-colors', lastMessageColor]">
                        <SafeEmojiText truncate :text="lastMessageText" />
                    </div>
                </div>

                <div class="h-full flex items-center shrink-0 ms-2">
                    <div v-loading="isLoading" v-if="contact.unreadCount > 0"
                        class="rounded-full justify-center min-w-6 px-1.5 h-5 flex bg-gradient-error items-center select-none">
                        <div dir="ltr" class="text-white text-[10px] font-bold text-center">
                            {{ contact.unreadCount > 99 ? '+99' : contact.unreadCount }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, type PropType } from 'vue';
import type { Contact } from '~/types/chat';
import { useI18n, useDate, useChatStore } from '~/nuxt-shims';
import ContactAvatar from './ContactAvatar.vue';
import SafeEmojiText from '~/components/general/SafeEmojiText.vue';

export default defineComponent({
    name: "ContactDisplay",
    props: {
        contact: {
            type: Object as PropType<Contact>,
            required: true,
        },
        loading: {
            type: Boolean,
            default: false,
        }
    },
    components: {
        SafeEmojiText,
        ContactAvatar,
    },
    setup(props) {
        const { t } = useI18n();
        const { formatRelativeDate } = useDate();
        const chatStore = useChatStore();
        const isActive = computed(() => chatStore.activeConversationId === props.contact.id);

        const openChat = () => {
            chatStore.setSelectedChat(props.contact.id);
        }

        const isFromMe = computed(() => props.contact.lastMessage?.senderId === chatStore.currentUserId);

        const lastMessageIcon = computed(() => {
            const msg = props.contact.lastMessage;
            if (!msg || !isFromMe.value) return { color: '', icon: '' };

            if (!msg.isSent) return { color: 'fill-on-surface/30', icon: 'PhClock' };
            if (!msg.isRead) return { color: 'fill-on-surface/50', icon: 'PhCheck' };
            return { color: 'fill-primary', icon: 'PhChecks' };
        });

        const attachmentIcon = computed(() => {
            const msg = props.contact.lastMessage;
            if (!msg) return null;

            if (msg.request) return 'PhSubtitles';

            const icons: Record<string, string> = {
                image: 'PhImage',
                file: 'PhFile',
                voice: 'PhMicrophone',
                video: 'PhVideo'
            };

            if (msg.type !== 'text') {
                return icons[msg.type] || null;
            }

            return null;
        });

        // 3. Logic for name prefix and attachment translation
        const lastMessageText = computed(() => {
            const msg = props.contact.lastMessage;
            if (!msg) return '';

            // Handle content (Text or Attachment Title)
            let content = msg.text;
            if (!content && msg.request) {
                content = t('chat.attachementTypes.request')
            }
            if (!content && msg.type !== 'text') {
                content = t(`chat.attachementTypes.${msg.type}`);
            }

            // Handle Name Prefix
            if (!isFromMe.value) {
                return `${props.contact.name}: ${content}`;
            }

            return content;
        });

        // 2. Logic for text color
        const lastMessageColor = computed(() => {
            const msg = props.contact.lastMessage;
            if (!msg) return 'text-on-surface/50';

            // If it's a pure attachment without text caption
            if (!msg.text && msg.type !== 'text' || msg.request) return 'text-primary font-medium';

            // If there are unread messages
            if (props.contact.unreadCount > 0) return 'text-on-surface font-medium';

            return 'text-on-surface/50';
        });

        const isLoading = computed(() => props.loading)

        return {
            lastMessageIcon,
            attachmentIcon,
            isActive,
            openChat,
            formatRelativeDate,
            lastMessageText,
            isLoading,
            lastMessageColor,
            t
        }
    }
})
</script>
