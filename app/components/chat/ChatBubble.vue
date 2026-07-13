<script setup lang="ts">
import ImageGroupDisplay from "./chat-bubbles/ImageGroupDisplay.vue";
import { computed, ref, onBeforeUnmount, useTemplateRef } from "vue";
import type { Contact, ExtendedMessage } from "~/types/chat";
import BubbleOptions from "./chat-bubbles/BubbleOptions.vue";
import { useMessagesStore } from "~/stores/messageStores.js";
import VoiceDisplay from "./chat-bubbles/VoiceDisplay.vue";
import BubbleVideo from "./chat-bubbles/BubbleVideo.vue";
import FileDisplay from "./chat-bubbles/FileDisplay.vue";
import SafeEmojiText from "../general/SafeEmojiText.vue";
import ContactAvatar from "./contact/ContactAvatar.vue";
import { useChatStore } from "~/stores/chatStore.js";
import { useDate } from "~/composables/useDate.js";
import { useI18n } from "vue-i18n";

const props = withDefaults(
  defineProps<{
    message: ExtendedMessage;
    contact: Contact;
    isFirstUnread?: boolean;
    isDeleting?: boolean;
  }>(),
  {
    isFirstUnread: false,
    isDeleting: false,
  },
);

const { t } = useI18n();
const chatStore = useChatStore();
const messagesStore = useMessagesStore();
const { formatDateShort, formatTime } = useDate();

// Isolate the `openMenu` TS error to this specific ref instead of disabling TS checks globally
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BubbleOptionsInstance = any;
type ImageDisplayInstance = InstanceType<typeof ImageGroupDisplay>;

const imageDisplayRef = useTemplateRef<ImageDisplayInstance>("imageDisplayRef");
const bubbleOptionsRef =
  useTemplateRef<BubbleOptionsInstance>("bubbleOptionsRef");

const isMine = computed(
  () => props.message.senderId === chatStore.currentUserId,
);

const isSelected = computed(() =>
  messagesStore.selectedMessages.has(props.message.id),
);
const isSelectMode = computed(() => messagesStore.isSelectMode);

const messageType = computed(() => {
  if (props.message.voiceUrl?.trim()) return "voice";
  if (props.message.imageUrl && props.message.imageUrl.length > 1)
    return "multiImage";
  if (props.message.imageUrl?.length === 1 && props.message.imageUrl[0]?.trim())
    return "image";
  if (props.message.videoUrl?.trim()) return "video";
  if (props.message.fileUrl?.trim()) return "file";
  return "text";
});

const isSameDayNext = computed(() => {
  if (!props.message.nextMessage) return false;
  return (
    new Date(props.message.date).toDateString() ===
    new Date(props.message.nextMessage.date).toDateString()
  );
});

const roundingClasses = computed(() => {
  const isPrevSameSender =
    props.message.prevMessage?.senderId === props.message.senderId;
  if (isMine.value)
    return isPrevSameSender ? "rounded-r-none" : "rounded-br-none";
  return isPrevSameSender ? "rounded-l-none" : "rounded-bl-none";
});

const shouldShowStatus = computed(() => {
  const nextMsg = props.message.nextMessage;
  if (!nextMsg) return true;
  const isNextSameSender = nextMsg.senderId === props.message.senderId;
  if (!isNextSameSender || !isSameDayNext.value) return true;
  const currentTime = new Date(props.message.date).getTime();
  const nextTime = new Date(nextMsg.date).getTime();
  return nextTime - currentTime > 2 * 60 * 1000; // 2 minutes threshold
});

const isSameSenderNext = computed(
  () => props.message.nextMessage?.senderId === props.message.senderId,
);

const displayedImages = computed(
  () => props.message.imageUrl?.slice(0, 3) || [],
);

const checkIcon = computed(() => {
  if (props.message.isSent)
    return props.message.isRead ? "PhChecks" : "PhCheck";
  return "PhClock";
});

const replyName = computed(() => {
  if (!props.message.repliedTo) return "";
  return props.message.repliedTo.senderId === chatStore.currentUserId
    ? t("chat.you")
    : props.contact.name;
});

const replyContent = computed(() => {
  const msg = props.message.repliedTo;
  if (!msg) return "";
  if (msg.videoUrl?.trim()) return t("chat.attachementTypes.video");
  if (msg.voiceUrl?.trim()) return t("chat.attachementTypes.voice");
  if (msg.fileUrl?.trim()) return t("chat.attachementTypes.file");
  if (msg.imageUrl?.length > 0) return t("chat.attachementTypes.image");
  return msg.text;
});

const uploadData = computed(() =>
  messagesStore.uploadProgress.get(props.message.id),
);

// --- Actions ---
const previewImage = (index: number) => {
  imageDisplayRef.value?.open(index);
};

const handleRightClick = (event: MouseEvent) => {
  if (props.message.request || !props.message.isSent) return;
  if (!messagesStore.isSelectMode) {
    messagesStore.selectedMessages.clear();
    messagesStore.toggleSelection(props.message);
  }
  bubbleOptionsRef.value?.openMenu(event.clientX, event.clientY);
};

const handleLeftClick = () => {
  if (messagesStore.isSelectMode) {
    messagesStore.toggleSelection(props.message);
  }
};

// --- Long Press / Touch Logic ---
const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const touchStartPos = ref({ x: 0, y: 0 });

const onPointerDown = (event: PointerEvent) => {
  if (event.button !== 0 && event.pointerType === "mouse") return;
  if (messagesStore.isSelectMode) return;

  touchStartPos.value = { x: event.clientX, y: event.clientY };

  longPressTimer.value = setTimeout(() => {
    if ("vibrate" in navigator) navigator.vibrate(50);
    handleRightClick(event as unknown as MouseEvent);
    longPressTimer.value = null;
  }, 1000);
};

const onPointerMove = (event: PointerEvent) => {
  if (!longPressTimer.value) return;
  const deltaX = Math.abs(event.clientX - touchStartPos.value.x);
  const deltaY = Math.abs(event.clientY - touchStartPos.value.y);
  if (deltaX > 10 || deltaY > 10) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};

const onPointerUp = () => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
    longPressTimer.value = null;
  }
};

// Cleanup timer if component unmounts while holding
onBeforeUnmount(() => {
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value);
  }
});
</script>

<template>
  <div
    @contextmenu.prevent="handleRightClick"
    class="w-full transition-all duration-300 ease-in-out"
    :class="[
      isDeleting
        ? 'max-h-0 overflow-hidden opacity-0'
        : 'max-h-250 opacity-100',
    ]"
  >
    <div
      v-if="message.isFirstInDate || isFirstUnread"
      class="flex w-full items-center justify-center py-5"
    >
      <div
        class="flex items-center justify-center rounded-full bg-on-surface/10 px-4 py-0.5"
      >
        <div class="select-none text-body-sm text-on-surface">
          {{
            !isFirstUnread
              ? formatDateShort(message.date)
              : t("chat.unreadMessages")
          }}
        </div>
      </div>
    </div>

    <div
      class="flex w-full items-center px-5 pt-2 transition-all duration-200 ease-in-out"
      :class="[
        isSelectMode && isSelected
          ? 'gap-x-3 bg-on-surface/5'
          : 'gap-x-0 bg-on-surface/0',
        isSelectMode ? 'cursor-pointer select-none' : '',
      ]"
    >
      <!-- Selection Checkbox -->
      <div
        v-if="!message.request"
        class="shrink-0 whitespace-nowrap overflow-hidden transition-all duration-200 ease-in-out"
        :class="[isSelectMode && isSelected ? 'w-auto' : 'w-0']"
      >
        <div
          class="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-primary-secondary transition-all duration-200 ease-in-out"
          :class="[
            isSelectMode && isSelected
              ? 'scale-100 opacity-100'
              : 'scale-0 opacity-0',
          ]"
        >
          <div class="h-2.5 w-2.5 rounded-full bg-surface" />
        </div>
      </div>

      <!-- Message Content Wrapper -->
      <div
        v-if="!message.request"
        class="relative flex flex-1 items-center"
        :class="[isMine ? 'justify-start' : 'justify-end']"
        @click="handleLeftClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="w-full select-none md:select-auto">
          <div
            class="flex w-full items-center"
            :class="[isMine ? 'justify-start' : 'justify-end']"
          >
            <div class="flex max-w-4/5 items-end gap-x-3">
              <div class="flex-1">
                <!-- Text / File / Voice Bubble -->
                <div
                  v-if="
                    messageType === 'text' ||
                    messageType === 'file' ||
                    messageType === 'voice'
                  "
                  class="rounded-xl p-1"
                  :class="[
                    roundingClasses,
                    isMine ? 'bg-surface-variant-2' : 'bg-surface',
                    messageType === 'text'
                      ? 'text-body-sm text-on-surface'
                      : '',
                  ]"
                >
                  <!-- Reply Preview -->
                  <div
                    v-if="messageType === 'text' && message.repliedTo"
                    class="flex h-10 w-full items-center justify-between gap-x-2 rounded-lg p-2 text-body-sm select-none"
                    :class="[
                      isMine ? 'bg-surface-variant-3' : 'bg-surface-variant',
                    ]"
                  >
                    <div class="shrink-0 text-on-surface/50">
                      {{ replyName }} :
                    </div>
                    <div class="flex-1 text-on-surface">
                      <div
                        class="line-clamp-1 w-full overflow-hidden text-ellipsis"
                      >
                        {{ replyContent }}
                      </div>
                    </div>
                    <BIcon
                      icon="PhArrowUUpLeft"
                      weight="fill"
                      class="h-5 w-5 fill-on-surface/20"
                    />
                  </div>

                  <p v-if="messageType === 'text'" class="max-w-full p-3">
                    <SafeEmojiText :text="message.text" />
                  </p>

                  <FileDisplay
                    v-else-if="message.fileUrl && messageType === 'file'"
                    :is-mine="isMine"
                    :url="message.fileUrl"
                    :message-id="message.id"
                    :is-sent="message.isSent"
                  />

                  <VoiceDisplay
                    v-else-if="message.voiceUrl && messageType === 'voice'"
                    :url="message.voiceUrl"
                    :message-id="message.id"
                    :is-sent="message.isSent"
                  />
                </div>

                <!-- Single Image -->
                <div
                  v-else-if="message.imageUrl && messageType === 'image'"
                  class="relative max-w-4/5 cursor-pointer overflow-hidden rounded-xl w-85 h-40.5 md:max-w-85"
                  @click.stop="previewImage(0)"
                >
                  <BImage
                    :src="message.imageUrl[0]"
                    fit="cover"
                    class="absolute inset-0 h-full w-full min-h-full min-w-full max-h-full max-w-full overflow-hidden rounded-xl"
                  />
                  <div
                    v-if="!message.isSent && uploadData"
                    class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40"
                  >
                    <svg
                      class="absolute h-12 w-12 -rotate-90"
                      viewBox="0 0 48 48"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        class="fill-none stroke-white/30"
                        stroke-width="3"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        class="fill-none stroke-white transition-all duration-200 ease-linear"
                        stroke-width="3"
                        stroke-linecap="round"
                        stroke-dasharray="138.2"
                        :stroke-dashoffset="
                          138.2 - (uploadData.progress / 100) * 138.2
                        "
                      />
                    </svg>
                    <BIcon
                      icon="PhUploadSimple"
                      class="absolute h-5 w-5 text-white"
                    />
                  </div>
                </div>

                <!-- Multiple Images -->
                <div
                  v-else-if="message.imageUrl && messageType === 'multiImage'"
                  class="flex h-16 max-w-75 items-center gap-x-3"
                >
                  <div
                    v-if="message.imageUrl.length > 3"
                    class="flex aspect-square h-full cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-surface-variant-2"
                    @click="previewImage(3)"
                  >
                    <div class="select-none text-label-md text-on-surface">
                      +{{ message.imageUrl.length - 3 }}
                    </div>
                  </div>
                  <div
                    v-for="(image, index) in displayedImages"
                    :key="index"
                    class="relative aspect-square h-full cursor-pointer overflow-hidden rounded-xl"
                    @click.stop="previewImage(index)"
                  >
                    <BImage
                      :src="image"
                      class="h-full w-full min-h-full min-w-full max-h-full max-w-full cursor-pointer"
                    />
                    <div
                      v-if="!message.isSent && uploadData"
                      class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/40"
                    >
                      <svg
                        class="absolute h-8 w-8 -rotate-90"
                        viewBox="0 0 32 32"
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          class="fill-none stroke-white/30"
                          stroke-width="2.5"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          class="fill-none stroke-white transition-all duration-200 ease-linear"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-dasharray="87.9"
                          :stroke-dashoffset="
                            87.9 - (uploadData.progress / 100) * 87.9
                          "
                        />
                      </svg>
                      <BIcon
                        icon="PhUploadSimple"
                        class="absolute h-3.5 w-3.5 text-white"
                      />
                    </div>
                  </div>
                </div>

                <!-- Video -->
                <div v-else-if="messageType === 'video'">
                  <BubbleVideo :video-url="message.videoUrl" mode="playback" />
                </div>

                <!-- Timestamp & Status -->
                <div
                  v-if="shouldShowStatus"
                  class="flex w-full items-center gap-x-2.5 pt-2"
                  :class="[isMine ? 'justify-start' : 'justify-end']"
                >
                  <BIcon
                    v-if="isMine"
                    :icon="checkIcon"
                    class="h-4 w-4"
                    :class="[
                      message.isRead && message.isSent
                        ? 'fill-primary'
                        : 'fill-on-surface/50',
                    ]"
                  />
                  <div class="select-none text-body-sm text-on-surface/50">
                    {{ formatTime(message.date) }}
                  </div>
                </div>
              </div>

              <!-- Avatar -->
              <div class="w-10 shrink-0 pb-8">
                <div
                  v-if="!isMine && (!isSameSenderNext || !isSameDayNext)"
                  class="h-10 w-10"
                >
                  <ContactAvatar :contact="contact" :show-online="false" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <ImageGroupDisplay
          v-show="message.imageUrl && message.imageUrl.length > 0"
          ref="imageDisplayRef"
          :images="message.imageUrl"
        />

        <BubbleOptions ref="bubbleOptionsRef" :message="message" />
      </div>

      <!-- Request Card -->
      <div v-if="message.request" class="flex w-full justify-center py-3">
        <RequestCard :message="message" :contact="contact" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-out-right {
  0% {
    transform: scaleY(-1) translateX(0);
    opacity: 1;
  }
  100% {
    transform: scaleY(-1) translateX(40px);
    opacity: 0;
  }
}

@keyframes slide-out-left {
  0% {
    transform: scaleY(-1) translateX(0);
    opacity: 1;
  }
  100% {
    transform: scaleY(-1) translateX(-40px);
    opacity: 0;
  }
}

.animate-delete-right {
  animation: slide-out-right 300ms ease-in forwards;
  white-space: nowrap;
}

.animate-delete-left {
  animation: slide-out-left 300ms ease-in forwards;
  white-space: nowrap;
}

.msg-slide-enter-active {
  transition: all 0.3s ease-out;
}
.msg-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.msg-grow-enter-active {
  transition:
    grid-template-rows 0.4s ease,
    opacity 0.4s ease;
  display: grid;
  grid-template-rows: 1fr;
}
.msg-grow-enter-from {
  grid-template-rows: 0fr;
  opacity: 0;
}
.msg-grow-enter-active > div {
  overflow: hidden;
}
</style>
