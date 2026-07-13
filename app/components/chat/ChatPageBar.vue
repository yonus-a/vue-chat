<template>
  <div class="relative z-20 w-full">
    <div
      v-if="selectedChat"
      class="relative z-50 flex h-16 w-full items-center justify-between gap-x-4 border-b border-b-outline-variant bg-surface py-4 px-5 md:h-20"
    >
      <div
        class="relative flex w-full flex-row-reverse items-center justify-end gap-x-4 md:flex-row md:justify-between"
      >
        <div
          class="flex cursor-pointer items-center gap-x-3"
          @click="openProfile"
        >
          <div class="relative h-10 w-10 shrink-0">
            <ContactAvatar v-if="contact" :contact="contact" />
          </div>
          <div class="select-none">
            <div class="text-label-md text-on-surface">
              {{ selectedChat.name }} {{ selectedChat.lastName }}
            </div>
            <div class="text-body-sm text-on-surface/50">
              {{
                t("chat.lastSeen", {
                  time: formatRelativeDate(selectedChat.lastSeen),
                })
              }}
            </div>
          </div>
        </div>

        <div class="relative z-[1001] h-6">
          <div
            class="relative transition-all duration-200 ease-in-out"
            :class="[isSelectMode ? '-translate-y-6' : 'translate-y-0']"
          >
            <div
              class="relative flex items-center gap-x-4 transition-all duration-200 ease-in-out"
              :class="[
                isSelectMode
                  ? 'pointer-events-none opacity-0'
                  : 'pointer-events-auto opacity-100',
              ]"
            >
              <div class="hidden md:block">
                <BIcon
                  icon="PhPhone"
                  class="h-6 w-6"
                  :class="[
                    contact?.isActive || isInCall
                      ? 'cursor-pointer fill-on-surface/50'
                      : 'cursor-not-allowed fill-on-surface/25',
                  ]"
                  @click="initCall"
                  v-if="selectedChat.serviceType !== 'chat'"
                />
              </div>
            </div>
            <div
              class="hidden items-center gap-x-4 md:flex"
              :class="[
                !isSelectMode
                  ? 'pointer-events-none opacity-0'
                  : 'pointer-events-auto opacity-100',
              ]"
            >
              <BIcon
                icon="PhTrash"
                class="h-6 w-6"
                :class="[
                  canDelete
                    ? 'cursor-pointer fill-error'
                    : 'cursor-not-allowed fill-on-surface/50',
                ]"
                @click="deleteMessages"
              />
              <BIcon
                icon="PhCopy"
                class="h-6 w-6 cursor-pointer fill-on-surface"
                @click="copy"
              />
            </div>
          </div>
        </div>
      </div>
      <BIcon
        icon="PhArrowLeft"
        class="md:hidden h-6 w-6 cursor-pointer fill-on-surface/50"
        @click="goBack"
      />
    </div>

    <div class="absolute bottom-0 z-20 h-0 w-full overflow-visible">
      <div
        class="flex w-full items-center overflow-hidden whitespace-nowrap bg-diamond-primary-secondary text-wrap px-2 transition-all duration-200 ease-in-out"
        :class="[callData.show ? 'h-11' : 'h-0']"
      >
        <div
          class="flex w-full items-center gap-x-3 transition-all duration-200 ease-in-out"
          :class="[callData.show ? 'opacity-100' : 'opacity-0']"
        >
          <BIcon icon="PhPhoneCall" class="h-5 w-5 shrink-0 fill-white" />
          <div class="flex-1 select-none text-label-md text-white">
            {{ callData.duration }}
          </div>
          <BIcon
            icon="PhFrameCorners"
            class="h-5 w-5 shrink-0 cursor-pointer fill-white"
            @click="backToCall"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMessagesStore } from "~/stores/messageStores.js";
import ContactAvatar from "./contact/ContactAvatar.vue";
import { useCallStore } from "~/stores/callStore.js";
import { useChatStore } from "~/stores/chatStore.js";
import { useDate } from "~/composables/useDate.js";
import { formatDuration } from "~/utils/format";
import type { Contact } from "~/types/chat";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    contact: Contact | null;
    options: any[];
  }>(),
  {
    contact: null,
    options: () => [],
  },
);

const emit = defineEmits<{
  call: [];
  "open-profile": [];
}>();

const messagesStore = useMessagesStore();
const { formatRelativeDate } = useDate();
const callStore = useCallStore();
const chatStore = useChatStore();
const { t } = useI18n();

const currentConversationId = computed(() => chatStore.activeConversationId);
const selectedChat = computed(() => props.contact);
const isSelectMode = computed(() => messagesStore.isSelectMode);
const canDelete = computed(() => messagesStore.canDelete);
const isInCall = computed(() => callStore.isActive);

const callData = computed(() => ({
  show: callStore.isActive,
  duration: formatDuration(callStore.elapsedTime),
}));

const openProfile = () => {
  emit("open-profile");
};

const goBack = () => {
  chatStore.setSelectedChat(null);
};

const copy = () => {
  messagesStore.copyMessageText();
};

const deleteMessages = () => {
  if (!canDelete.value) return;
  messagesStore.triggerDelete();
};

const initCall = () => {
  const kind = props.contact?.serviceType;
  if (
    props.contact?.isActive &&
    currentConversationId.value &&
    (kind === "voice-call" || kind === "video-call")
  ) {
    callStore.startCall(props.contact, currentConversationId.value, kind);
  }
};

const backToCall = () => {
  callStore.maximize();
};
</script>
