<template>
  <div class="w-full bg-surface-variant h-full">
    <div
      v-show="canShowMessagingSection || isProfile"
      class="h-full w-full flex"
    >
      <ChatProfileOverview :profile="selectedChat" />
      <div
        class="flex flex-1 flex-col justify-between items-center h-full"
        v-show="chatId && isChatMode"
      >
        <div class="w-full bg-surface h-16 md:h-20">
          <ChatPageBar
            :options="medicOptions"
            @open-profile="openProfile"
            :contact="selectedChat"
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
      <div
        v-show="!chatId"
        class="w-full h-full flex items-center justify-center"
      ></div>
    </div>
    <CallPageOverlay
      v-show="isCallMode && selectedChat"
      :contact="selectedChat"
    />
    <PatientReferral ref="patientRefferal" :contact="selectedChat" />
    <PermissionPopup />
    <PrescribtionDisplay />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, nextTick, watch, useTemplateRef, type DefineComponent } from "vue";
import { useI18n, useWindowSize, useChatStore, useCallStore } from "~/nuxt-shims";
import ChatPageBar from "~/components/chat/ChatPageBar.vue";
import ChatInput from "~/components/chat/ChatInput.vue";
import { type ChatTextField } from "~/types/components/chat-input";
import ChatProfileOverview from "~/components/chat/ChatProfileOverview.vue";
import ChatMessages from "~/components/chat/ChatMessages.vue";
import { type MenuOption } from "~/types/components/menu-options";
import PatientReferral from "~/components/chat/PatientReferral.vue";
import type { PatientRefferalExposed } from "~/components/chat/PatientReferral.vue";
import CallPageOverlay from "~/components/call/CallPageOverlay.vue";
import PermissionPopup from "~/components/chat/chat-input/PermissionPopup.vue";
import PrescribtionDisplay from "~/components/chat/medic-features/PrescribtionDisplay.vue";

const ChatView = defineComponent({
  name: "ChatView",
  components: {
    ChatPageBar,
    CallPageOverlay,
    ChatInput,
    ChatProfileOverview,
    ChatMessages,
    PermissionPopup,
    PrescribtionDisplay,
    PatientReferral,
  },
  setup() {
    const chatStore = useChatStore();
    const callStore = useCallStore();
    const { t } = useI18n();
    const chatInput = ref<ChatTextField | null>(null);
    const { width } = useWindowSize();
    const isMobile = computed(() => width.value < 768);

    const chatId = computed(() => chatStore.activeConversationId);
    const isProfile = computed(() => chatStore.profileViewOpen);
    const isCallMode = computed(() => callStore.isActive && !callStore.isPiP);

    const selectedChat = computed(() => {
      if (!chatId.value) return null;
      return chatStore.getContactById(chatId.value);
    });

    const chatMessagesRef = ref<any>(null);
    const patientRefferal =
      useTemplateRef<PatientRefferalExposed>("patientRefferal");

    const canShowMessagingSection = computed(() => {
      if (isCallMode.value) return false;
      if (isMobile.value) return !isProfile.value;
      return true;
    });

    const isChatMode = computed(() => {
      if (isMobile.value) {
        return !isProfile.value;
      }
      return canShowMessagingSection.value;
    });

    watch(
      () => chatStore.activeConversationId,
      () => {
        if (chatId.value && selectedChat.value?.isActive) {
          nextTick(() => {
            chatInput.value?.focus();
          });
        }
      },
    );

    const openProfile = () => {
      chatStore.openProfile();
    };

    const handleNewMessages = (newMsgs: any[]) => {
      if (!newMsgs || newMsgs.length === 0) return;
      chatMessagesRef.value?.addMessages(newMsgs);
    };

    const handleEditMessage = (_payload: { id: string; text: string }) => {
      // hook for future use
    };

    const medicOptions = computed<MenuOption[]>(() => [
      {
        label: t("chat.barOptions.prescribeMedications"),
        icon: "PhPencilSimpleLine",
        key: "prescribe-meds",
      },
      {
        label: t("chat.barOptions.addPerson"),
        icon: "PhUserPlus",
        key: "add-user",
      },
      {
        label: t("chat.barOptions.refer"),
        icon: "PhTreeStructure",
        key: "refer",
      },
      {
        label: t("chat.barOptions.endChat"),
        icon: "PhXSquare",
        key: "end-chat",
      },
      {
        label: t("chat.barOptions.deleteMessages"),
        icon: "PhTrash",
        key: "delete-all",
        color: "error",
      },
    ]);

    return {
      medicOptions,
      t,
      chatId,
      chatInput,
      isProfile,
      isCallMode,
      openProfile,
      patientRefferal,
      chatMessagesRef,
      selectedChat,
      isMobile,
      isChatMode,
      canShowMessagingSection,
      handleNewMessages,
      handleEditMessage,
    };
  },
});

// Cast at the export boundary: Volar still uses the inferred bindings inside
// the SFC's template, but the public type erases the deep slot-tree inference
// that names private types from child components (and trips TS4082 on emit).
export default ChatView as unknown as DefineComponent<{}, {}, any>;
</script>
