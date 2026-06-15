<template>
  <div class="flex w-full h-full max-h-full overflow-hidden bg-surface-variant">
    <div v-if="showMessagingSection" class="h-full flex-1 relative">
      <template v-if="selectedChatId">
        <div class="h-full w-full flex">
          <ChatProfileOverview :profile="selectedChat" />
          <div
            v-show="selectedChatId && isChatMode"
            class="flex flex-1 flex-col justify-between items-center h-full"
          >
            <div class="w-full bg-surface h-16 md:h-20">
              <ChatPageBar
                :options="medicOptions"
                :contact="selectedChat"
                @open-profile="openProfile"
              />
            </div>
            <div class="flex-1 w-full min-h-0 overflow-hidden">
              <ChatMessages
                :options="medicOptions"
                v-show="selectedChat"
                :contact="selectedChat"
              />
            </div>
            <ChatInput ref="chatInput" :is-active="selectedChat?.isActive" />
          </div>
        </div>
        <CallPageOverlay
          v-show="isCallMode && selectedChat"
          :contact="selectedChat"
        />
        <PatientReferral ref="patientRefferal" :contact="selectedChat" />
        <PermissionPopup />
        <PrescribtionDisplay />
      </template>
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
      <ChatList v-model:search-text="searchText" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, nextTick, useTemplateRef } from 'vue';
import {
  useI18n,
  useSeoMeta,
  useWindowSize,
  useChatStore,
  useCallStore,
} from '#imports';
import ChatPageBar from '~/components/chat/ChatPageBar.vue';
import ChatInput from '~/components/chat/ChatInput.vue';
import type { ChatTextField } from '~/types/components/chat-input';
import ChatProfileOverview from '~/components/chat/ChatProfileOverview.vue';
import ChatMessages from '~/components/chat/ChatMessages.vue';
import ChatList from '~/components/chat/contact/ChatList.vue';
import NoDataDisplay from '~/components/general/NoDataDisplay.vue';
import NoChatSelected from '/images/chat/no-chat-selected.webp';
import { type MenuOption } from '~/types/components/menu-options';
import PatientReferral from '~/components/chat/PatientReferral.vue';
import type { PatientRefferalExposed } from '~/components/chat/PatientReferral.vue';
import CallPageOverlay from '~/components/call/CallPageOverlay.vue';
import PermissionPopup from '~/components/chat/chat-input/PermissionPopup.vue';
import PrescribtionDisplay from '~/components/chat/medic-features/PrescribtionDisplay.vue';

export default defineComponent({
  name: 'ChatDashboard',
  components: {
    ChatPageBar,
    CallPageOverlay,
    ChatList,
    ChatInput,
    ChatProfileOverview,
    ChatMessages,
    NoDataDisplay,
    PermissionPopup,
    PrescribtionDisplay,
    PatientReferral,
  },
  props: {
    initialSearch: { type: String, default: '' },
  },
  emits: ['update:search'],
  setup(props, { emit }) {
    const chatStore = useChatStore();
    const callStore = useCallStore();
    const { t } = useI18n();
    const { width } = useWindowSize();

    const searchText = ref<string>(props.initialSearch);
    watch(searchText, (v) => emit('update:search', v));

    const chatInput = ref<ChatTextField | null>(null);
    const patientRefferal = useTemplateRef<PatientRefferalExposed>('patientRefferal');

    const isMobile = computed(() => width.value < 768);

    const selectedChatId = computed(() => chatStore.activeConversationId);
    const selectedChat = computed(() =>
      selectedChatId.value ? chatStore.getContactById(selectedChatId.value) : null,
    );

    const isProfile = computed(() => chatStore.isProfileOpen);
    const isCallMode = computed(() => callStore.isActive);

    // Alias to avoid exposing the entire store to the template
    const openProfile = () => chatStore.openProfile();

    const canShowMessagingSection = computed(() => {
      if (isCallMode.value) return false;
      if (isMobile.value) return !isProfile.value;
      return true;
    });

    const isChatMode = computed(() => {
      if (isMobile.value) return !isProfile.value;
      return canShowMessagingSection.value;
    });

    const showContactList = computed(() => {
      if (isMobile.value) return !selectedChatId.value;
      return true;
    });

    const showMessagingSection = computed(() => {
      if (isMobile.value) return !!selectedChatId.value;
      return true;
    });

    watch(selectedChatId, () => {
      if (selectedChatId.value && selectedChat.value?.isActive) {
        nextTick(() => {
          chatInput.value?.focus();
        });
      }
    });

    useSeoMeta({
      title: () => t('seo.dashboard.chat.title'),
      description: () => t('seo.dashboard.chat.description'),
      ogTitle: () => `${t('seo.siteName')} - ${t('seo.dashboard.chat.title')}`,
    });

    const medicOptions = computed<MenuOption[]>(() => [
      { label: t('chat.barOptions.prescribeMedications'), icon: 'PhPencilSimpleLine', key: 'prescribe-meds' },
      { label: t('chat.barOptions.addPerson'), icon: 'PhUserPlus', key: 'add-user' },
      { label: t('chat.barOptions.refer'), icon: 'PhTreeStructure', key: 'refer' },
      { label: t('chat.barOptions.endChat'), icon: 'PhXSquare', key: 'end-chat' },
      { label: t('chat.barOptions.deleteMessages'), icon: 'PhTrash', key: 'delete-all', color: 'error' },
    ]);

    return {
      t,
      searchText,
      selectedChatId,
      selectedChat,
      isCallMode,
      isMobile,
      isChatMode,
      showContactList,
      showMessagingSection,
      openProfile,
      chatInput,
      patientRefferal,
      medicOptions,
      NoChatSelected,
    };
  },
});
</script>
