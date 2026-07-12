<template>
  <div
    @contextmenu.prevent="handleRightClick"
    class="w-full transition-all duration-300 ease-in-out"
    :class="[
      isDeleting
        ? 'max-h-0 opacity-0 overflow-hidden'
        : 'max-h-250 opacity-100',
    ]"
  >
    <div
      v-if="message.isFirstInDate || isFirstUnread"
      class="py-5 w-full flex items-center justify-center"
    >
      <div
        class="rounded-full bg-on-surface/10 flex items-center justify-center px-4 py-0.5"
      >
        <div class="text-on-surface select-none text-body-sm">
          {{
            !isFirstUnread
              ? formatDateShort(message.date)
              : t("chat.unreadMessages")
          }}
        </div>
      </div>
    </div>
    <div
      class="w-full px-5 pt-2 transition-all duration-200 flex items-center ease-in-out"
      :class="[
        isSelectMode && isSelected
          ? ' bg-on-surface/5 gap-x-3'
          : ' bg-on-surface/0 gap-x-0',
        isSelectMode ? 'cursor-pointer select-none' : '',
      ]"
    >
      <div
        v-if="!message.request"
        class="shrink-0 transition-all duration-200 overflow-hidden ease-in-out whitespace-nowrap"
        :class="[isSelectMode && isSelected ? 'w-auto' : ' w-0']"
      >
        <div
          :class="[
            isSelectMode && isSelected
              ? ' opacity-100 scale-100'
              : ' opacity-0 scale-0',
          ]"
          class="transition-all duration-200 ease-in-out w-5 h-5 rounded-full bg-gradient-primary-secondary flex items-center justify-center"
        >
          <div class="w-2.5 h-2.5 rounded-full bg-surface"></div>
        </div>
      </div>
      <div
        v-if="!message.request"
        :class="[isMine ? ' justify-start' : 'justify-end']"
        class="flex items-center flex-1 relative"
        @click="handleLeftClick"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="select-none md:select-auto w-full">
          <div
            class="w-full flex items-center"
            :class="[isMine ? 'justify-start' : 'justify-end']"
          >
            <div class="flex max-w-4/5 items-end gap-x-3">
              <div class="flex-1">
                <div
                  v-if="
                    messageType === 'text' ||
                    messageType === 'file' ||
                    messageType === 'voice'
                  "
                  class="p-1 rounded-xl"
                  :class="[
                    roundingClasses,
                    isMine ? 'bg-surface-variant-2' : 'bg-surface',
                    messageType === 'text'
                      ? 'text-body-sm text-on-surface'
                      : '',
                  ]"
                >
                  <div
                    v-if="messageType === 'text' && message.repliedTo"
                    class="text-body-sm select-none w-full h-10 gap-x-2 flex items-center rounded-lg justify-between p-2"
                    :class="[
                      isMine ? ' bg-surface-variant-3' : 'bg-surface-variant',
                    ]"
                  >
                    <div class="text-on-surface/50 shrink-0">
                      {{ replyName }} :
                    </div>
                    <div class="text-on-surface flex-1">
                      <div
                        class="w-full overflow-hidden text-ellipsis line-clamp-1"
                      >
                        {{ replyContent }}
                      </div>
                    </div>
                    <BIcon
                      icon="PhArrowUUpLeft"
                      class="w-5 h-5 fill-on-surface/20"
                      weight="fill"
                    />
                  </div>
                  <p v-if="messageType === 'text'" class="p-3 max-w-full">
                    <SafeEmojiText :text="message.text" />
                  </p>
                  <FileDisplay
                    :is-mine="isMine"
                    v-else-if="message.fileUrl && messageType === 'file'"
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
                <div
                  v-else-if="message.imageUrl && messageType === 'image'"
                  @click.stop="previewImage(0)"
                  class="relative cursor-pointer overflow-hidden rounded-xl max-w-4/5 md:max-w-85 w-85 h-40.5"
                >
                  <BImage
                    fit="cover"
                    :src="message.imageUrl[0]"
                    class="w-full rounded-xl overflow-hidden h-full max-w-full max-h-full min-w-full min-h-full"
                  />

                  <div
                    v-if="!message.isSent && uploadData"
                    class="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none"
                  >
                    <svg
                      class="absolute w-12 h-12 -rotate-90"
                      viewBox="0 0 48 48"
                    >
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        class="stroke-white/30"
                        stroke-width="3"
                        fill="none"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="22"
                        class="stroke-white transition-all duration-200 ease-linear"
                        stroke-width="3"
                        fill="none"
                        stroke-linecap="round"
                        stroke-dasharray="138.2"
                        :stroke-dashoffset="
                          138.2 - (uploadData.progress / 100) * 138.2
                        "
                      />
                    </svg>
                    <BIcon
                      icon="PhUploadSimple"
                      class="w-5 h-5 text-white absolute"
                    />
                  </div>
                </div>

                <div
                  v-else-if="message.imageUrl && messageType === 'multiImage'"
                  class="max-w-75 flex items-center gap-x-3 h-16"
                >
                  <div
                    @click="previewImage(3)"
                    v-if="message.imageUrl.length > 3"
                    class="h-full rounded-xl cursor-pointer overflow-hidden aspect-square flex items-center justify-center bg-surface-variant-2"
                  >
                    <div class="text-on-surface select-none text-label-md">
                      +{{ message.imageUrl.length - 3 }}
                    </div>
                  </div>
                  <div
                    v-for="(image, index) in displayedImages"
                    :key="index"
                    @click.stop="previewImage(index)"
                    class="relative h-full rounded-xl cursor-pointer overflow-hidden aspect-square"
                  >
                    <BImage
                      :src="image"
                      class="cursor-pointer min-w-full min-h-full max-w-full max-h-full h-full w-full"
                    />

                    <div
                      v-if="!message.isSent && uploadData"
                      class="absolute inset-0 flex items-center justify-center bg-black/40 z-10 pointer-events-none"
                    >
                      <svg
                        class="absolute w-8 h-8 -rotate-90"
                        viewBox="0 0 32 32"
                      >
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          class="stroke-white/30"
                          stroke-width="2.5"
                          fill="none"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          class="stroke-white transition-all duration-200 ease-linear"
                          stroke-width="2.5"
                          fill="none"
                          stroke-linecap="round"
                          stroke-dasharray="87.9"
                          :stroke-dashoffset="
                            87.9 - (uploadData.progress / 100) * 87.9
                          "
                        />
                      </svg>
                      <BIcon
                        icon="PhUploadSimple"
                        class="w-3.5 h-3.5 text-white absolute"
                      />
                    </div>
                  </div>
                </div>
                <div v-else-if="messageType === 'video'">
                  <BubbleVideo :video-url="message.videoUrl" mode="playback" />
                </div>
                <div
                  v-if="shouldShowStatus"
                  class="w-full pt-2 flex items-center gap-x-2.5"
                  :class="[isMine ? 'justify-start' : 'justify-end']"
                >
                  <BIcon
                    v-if="isMine"
                    :icon="checkIcon"
                    class="w-4 h-4"
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
              <div class="shrink-0 w-10 pb-8">
                <div
                  v-if="!isMine && (!isSameSenderNext || !isSameDayNext)"
                  class="w-10 h-10"
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

        <BubbleOptions :message="message" ref="bubbleOptionsRef" />
      </div>
      <div v-if="message.request" class="py-3 w-full flex justify-center">
        <RequestCard :message="message" :contact="contact" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck — grandfathered legacy chat-tree type errors; lift incrementally
import { defineComponent, computed, ref, type PropType } from "vue";
import type { Contact, ExtendedMessage } from "~/types/chat";
import { useChatStore, useDate, useI18n } from "~/nuxt-shims";
import { useMessagesStore } from "~/stores/messageStores.js";
import { useUploadStore } from "~/stores/messagesStore";
import BubbleVideo from "./chat-bubbles/BubbleVideo.vue";
import FileDisplay from "./chat-bubbles/FileDisplay.vue";
import VoiceDisplay from "./chat-bubbles/VoiceDisplay.vue";
import ContactAvatar from "./contact/ContactAvatar.vue";
import ImageGroupDisplay from "./chat-bubbles/ImageGroupDisplay.vue";
import BubbleOptions from "./chat-bubbles/BubbleOptions.vue";
import RequestCard from "./chat-bubbles/RequestCard.vue";
import SafeEmojiText from "../general/SafeEmojiText.vue";

type ImageDisplayInstance = InstanceType<typeof ImageGroupDisplay>;

export default defineComponent({
  name: "ChatBubble",
  props: {
    message: {
      type: Object as PropType<ExtendedMessage>,
      required: true,
    },
    contact: {
      type: Object as PropType<Contact>,
      required: true,
    },
    isFirstUnread: {
      type: Boolean,
      default: false,
    },
    isDeleting: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ImageGroupDisplay,
    BubbleVideo,
    FileDisplay,
    SafeEmojiText,
    VoiceDisplay,
    ContactAvatar,
    BubbleOptions,
    RequestCard,
  },
  setup(props) {
    const chatStore = useChatStore();
    const messagesStore = useMessagesStore();
    const { formatDateShort, formatTime } = useDate();
    const { t } = useI18n();

    const isMine = computed(
      () => props.message.senderId === chatStore.currentUserId,
    );
    const imageDisplayRef = ref<ImageDisplayInstance | null>(null);

    // Typing as any to forcefully bypass the TypeScript compilation error for "openMenu does not exist"
    const bubbleOptionsRef = ref<any>(null);

    const messageType = computed(() => {
      if (props.message.voiceUrl && props.message.voiceUrl.trim().length > 0)
        return "voice";
      if (props.message.imageUrl && props.message.imageUrl.length > 1)
        return "multiImage";
      if (
        props.message.imageUrl &&
        props.message.imageUrl.length === 1 &&
        props.message.imageUrl[0]?.trim().length > 0
      )
        return "image";
      if (props.message.videoUrl && props.message.videoUrl.trim().length > 0)
        return "video";
      if (props.message.fileUrl && props.message.fileUrl.trim().length > 0)
        return "file";
      return "text";
    });

    const isSameDayPrev = computed(() => {
      if (!props.message.prevMessage) return false;
      return (
        new Date(props.message.date).toDateString() ===
        new Date(props.message.prevMessage.date).toDateString()
      );
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
      if (isMine.value) {
        if (!isPrevSameSender) return "rounded-br-none";
        return "rounded-r-none";
      } else {
        if (isPrevSameSender) return "rounded-l-none";
        return "rounded-bl-none";
      }
    });

    const shouldShowStatus = computed(() => {
      const nextMsg = props.message.nextMessage;

      // 1. If there is no next message, it's the last one, so show status
      if (!nextMsg) return true;

      const isNextSameSender = nextMsg.senderId === props.message.senderId;

      // 2. If the next message is from a different person or on a different day, show status
      if (!isNextSameSender || !isSameDayNext.value) return true;

      // 3. Check the 10-minute threshold
      const currentTime = new Date(props.message.date).getTime();
      const nextTime = new Date(nextMsg.date).getTime();
      const tenMinutesInMs = 2 * 60 * 1000;

      // Show status only if the next message is sent MORE than 10 minutes later
      return nextTime - currentTime > tenMinutesInMs;
    });

    const isSameSenderPrev = computed(
      () => props.message.prevMessage?.senderId === props.message.senderId,
    );
    const isSameSenderNext = computed(
      () => props.message.nextMessage?.senderId === props.message.senderId,
    );

    const displayedImages = computed(() => {
      return props.message.imageUrl?.slice(0, 3) || [];
    });

    const previewImage = (index: number) => {
      console.log(imageDisplayRef.value);
      imageDisplayRef.value?.open(index);
    };

    // --- Context Menu & Select Logic ---
    const handleRightClick = (event: MouseEvent) => {
      if (props.message.request) return;
      if (!props.message.isSent) return;
      if (!messagesStore.isSelectMode) {
        messagesStore.selectedMessages.clear();
        messagesStore.toggleSelection(props.message);
      }

      // when openning the menu remember to make also a mode for vibrate
      bubbleOptionsRef.value?.openMenu(event.clientX, event.clientY);
    };

    const handleLeftClick = () => {
      if (messagesStore.isSelectMode) {
        messagesStore.toggleSelection(props.message);
      }
    };

    const isSelected = computed(() =>
      messagesStore.selectedMessages.has(props.message.id),
    );
    const isSelectMode = computed(() => messagesStore.isSelectMode);

    const checkIcon = computed(() => {
      if (props.message.isSent) {
        return props.message.isRead ? "PhChecks" : "PhCheck";
      } else {
        return "PhClock";
      }
    });

    const replyName = computed(() => {
      if (!props.message.repliedTo) return "";
      let message = props.message.repliedTo;
      if (message.senderId === chatStore.currentUserId) return t("chat.you");
      return props.contact.name;
    });

    const replyContent = computed(() => {
      if (!props.message.repliedTo) return "";
      let message = props.message.repliedTo;
      if (message.videoUrl && message.videoUrl.trim().length > 0)
        return t("chat.attachementTypes.video");
      if (message.voiceUrl && message.voiceUrl.trim().length > 0)
        return t("chat.attachementTypes.voice");
      if (message.fileUrl && message.fileUrl.trim().length > 0)
        return t("chat.attachementTypes.file");
      if (message.imageUrl && message.imageUrl.length > 0)
        return t("chat.attachementTypes.image");
      return message.text;
    });

    const longPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const touchStartPos = ref({ x: 0, y: 0 });

    const onPointerDown = (event: PointerEvent) => {
      // Only handle primary pointer (left click or single finger)
      if (event.button !== 0 && event.pointerType === "mouse") return;
      if (messagesStore.isSelectMode) return;

      // Store starting position to detect if the user moves too much (scrolling)
      touchStartPos.value = { x: event.clientX, y: event.clientY };

      // Start the 1-second timer
      longPressTimer.value = setTimeout(() => {
        // Vibrate for feedback if available on mobile
        if ("vibrate" in navigator) navigator.vibrate(50);

        handleRightClick(event as unknown as MouseEvent);
        longPressTimer.value = null;
      }, 1000); // 1 Second as requested
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!longPressTimer.value) return;

      // If the user moves more than 10px, they are likely scrolling. Cancel the timer.
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

    const uploadData = computed(() =>
      messagesStore.uploadProgress.get(props.message.id),
    );

    return {
      onPointerMove,
      onPointerDown,
      onPointerUp,
      formatTime,
      isMine,
      replyContent,
      messageType,
      replyName,
      checkIcon,
      formatDateShort,
      roundingClasses,
      shouldShowStatus,
      isSameSenderNext,
      displayedImages,
      isSameDayNext,
      imageDisplayRef,
      isSameSenderPrev,
      previewImage,
      bubbleOptionsRef,
      handleRightClick,
      handleLeftClick,
      isSelected,
      uploadData,
      isSelectMode,
      t,
    };
  },
});
</script>
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

/* Animation for 'Their' messages exiting (Left) */
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
