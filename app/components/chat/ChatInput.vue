<template>
  <div dir="rtl" class="relative w-full">
    <VideoRecordDisplay
      ref="videoDisplayRef"
      :stream="mediaStream"
      :is-paused="isPaused"
      :recording-time="currentRecordingSeconds"
      @flip-camera="handleFlipCamera"
    />

    <div>
      <div
        :class="[textMode !== 'normal' ? 'h-10' : 'h-0']"
        class="relative z-30 flex w-full items-center justify-between gap-x-3 overflow-hidden whitespace-nowrap border-t border-t-outline-variant bg-surface px-3 select-none text-body-sm transition-all duration-200 ease-in-out"
      >
        <BIcon
          :icon="
            textMode === 'edit' ? 'PhPencilSimpleLine' : 'PhArrowBendUpLeft'
          "
          class="h-5 w-5 shrink-0 fill-on-surface"
        />
        <div class="flex flex-1 items-center gap-x-2">
          <div v-if="textMode === 'reply'" class="shrink-0 text-on-surface/50">
            {{ displayActionName }} :
          </div>
          <div class="flex-1">
            <div
              class="line-clamp-1 w-full overflow-hidden text-ellipsis text-on-surface"
            >
              <SafeEmojiText :text="displayedActionText" />
            </div>
          </div>
        </div>
        <BIcon
          icon="PhX"
          class="h-5 w-5 shrink-0 cursor-pointer fill-on-surface/50"
          @click="cancelAction"
        />
      </div>
    </div>

    <div
      ref="rootElements"
      @contextmenu.prevent
      class="relative z-40 flex min-h-19 w-full items-end overflow-visible border-t border-t-outline-variant bg-surface px-4 py-4 select-none transition-all duration-200 ease-in-out"
    >
      <div
        class="relative z-30 mb-0.5 flex shrink-0 items-center justify-center"
        :style="{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }"
      >
        <div
          v-if="isRecording"
          class="absolute -top-20 flex w-9 flex-col items-center justify-center rounded-full bg-surface shadow-floating transition-opacity"
          :class="[
            isLocked
              ? 'pointer-events-auto py-1.5'
              : 'pointer-events-none gap-y-3 py-3',
          ]"
          :style="{ opacity: lockOpacity }"
        >
          <template v-if="!isLocked">
            <BIcon icon="PhLockKey" class="h-5 w-5 fill-on-surface" />
          </template>
          <template v-else>
            <div
              class="flex h-9 w-full cursor-pointer items-center justify-center"
              @click="togglePause"
            >
              <BIcon
                :icon="isPaused ? 'PhPlayCircle' : 'PhPauseCircle'"
                class="h-6 w-6 fill-on-surface"
              />
            </div>
          </template>
          <BIcon
            icon="PhCaretUp"
            class="h-4 w-4 animate-bounce fill-on-surface/60"
          />
        </div>

        <div
          class="flex h-11 w-11 touch-none items-center justify-center transition-all duration-200"
          :class="[
            (isRecording && !isLocked) || messageText.trim().length > 0
              ? 'rounded-full bg-primary/10'
              : 'h-6 w-6 bg-primary/0',
          ]"
          @pointerdown="!isLocked ? onRecordPointerDown($event) : null"
          @click="!isLocked ? toggleSecondaryMessageType() : null"
        >
          <BIcon
            v-if="!isLocked && messageText.trim().length === 0"
            :icon="secondaryMessageIcon"
            :weight="isRecording ? 'fill' : 'regular'"
            class="h-6 w-6 shrink-0 cursor-pointer transition-colors"
            :class="[isRecording ? 'fill-primary' : iconClass]"
          />
          <div
            v-else
            class="flex aspect-square min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-gradient-primary-secondary"
            @click.stop="sendRecording"
          >
            <BIcon
              icon="PhPaperPlaneTilt"
              class="h-6 w-6 shrink-0 fill-white"
            />
          </div>
        </div>
      </div>

      <div v-show="!isRecording" class="flex flex-1 items-end gap-x-5">
        <div class="flex min-h-11 w-full items-center">
          <div
            ref="inputRef"
            contenteditable="true"
            :data-placeholder="inputPlaceholder"
            class="z-10 max-h-[144px] min-h-[44px] w-full flex-1 cursor-text overflow-y-auto bg-transparent py-1 text-body-md leading-6 text-on-surface outline-none whitespace-pre-wrap break-words hide-scrollbar empty:before:content-[attr(data-placeholder)] empty:before:text-on-surface/50 pointer-events-auto"
            @keydown.enter.exact.prevent="handleEnterKey"
            @input="handleContentInput"
            @focus="onInputFocus"
            @blur="saveCursorPosition"
            @keyup="saveCursorPosition"
            @mouseup="saveCursorPosition"
          />
        </div>
        <div
          class="z-10 flex h-11 shrink-0 items-center gap-x-8"
          :class="[iconClass]"
        >
          <div class="hidden md:block">
            <BMenu ref="menuRef">
              <template #trigger>
                <BIcon
                  icon="PhSmiley"
                  class="h-6 w-6 cursor-pointer fill-on-surface"
                  @mousedown.prevent
                />
              </template>
              <div>
                <BEmojiPicker @select="handleEmojiSelect" />
              </div>
            </BMenu>
          </div>

          <BIcon
            icon="PhSmiley"
            class="h-6 w-6 cursor-pointer fill-on-surface md:hidden"
            @mousedown.prevent
            @click="toggleMobileEmoji"
          />
          <InputAttachement
            :initial-caption="messageText"
            @send-attachments="handleAttachments"
          />
        </div>
      </div>

      <div
        v-show="isRecording"
        class="flex -translate-y-2 flex-1 items-center justify-between"
      >
        <div />
        <div
          class="flex items-center justify-center text-body-md text-on-surface/70 transition-opacity"
          :style="{ opacity: cancelOpacity }"
        >
          <span v-if="!isLocked">{{ t("chat.swipeToCancel") }}</span>
          <span
            v-else
            class="z-20 cursor-pointer px-4 text-primary"
            @click="cancelRecording"
          >
            {{ t("chat.cancel") }}
          </span>
        </div>

        <div class="left-6 z-10 flex shrink-0 items-center gap-x-2">
          <div class="relative h-2.5 w-2.5">
            <div class="h-2.5 w-2.5 rounded-full bg-error" />
            <div
              class="absolute inset-0 h-2.5 w-2.5 animate-ping rounded-full bg-error"
            />
          </div>
          <span
            class="mt-0.5 min-w-12 text-center tabular-nums text-body-md text-on-surface"
            dir="ltr"
          >
            {{ formattedTime }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="relative z-30 w-full overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.33,1,0.68,1)] md:hidden"
      :class="
        showMobileEmojiPicker ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
      "
    >
      <BEmojiPicker @select="handleEmojiSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  watch,
  onMounted,
  onUnmounted,
  useTemplateRef,
} from "vue";
import type { Menu } from "~/types/components/menu";
import type { ExtendedMessage, Message } from "~/types/chat";
import InputAttachement from "./chat-input/InputAttachement.vue";
import {
  useAppPermissions,
  type PopupState,
} from "~/composables/useAppPermissions";
import { useChatRecording } from "~/composables/chat/useChatRecording";
import SafeEmojiText from "../general/SafeEmojiText.vue";
import { parseEmojiArray } from "~/utils/emojiParser";
import VideoRecordDisplay from "./chat-input/VideoRecordDisplay.vue";
import { useI18n } from "vue-i18n";
import { useMessagesStore } from "~/stores/messageStores.js";
import { useChatStore } from "~/stores/chatStore.js";
import { useCallStore } from "~/stores/callStore.js";

defineOptions({
  name: "ChatInput",
});

const props = withDefaults(
  defineProps<{
    isActive?: boolean;
  }>(),
  {
    isActive: false,
  },
);

const emit = defineEmits<{
  send: [];
  edit: [];
}>();

const { t } = useI18n();
const { requestWithPopup, checkMediaStatus } = useAppPermissions();
const messagesStore = useMessagesStore();
const chatStore = useChatStore();
const callStore = useCallStore();
const isDragging = ref();
// Template Refs
const rootElements = useTemplateRef<HTMLElement>("rootElements");
const inputRef = useTemplateRef<HTMLDivElement>("inputRef");
const menuRef = useTemplateRef<Menu>("menuRef");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const videoDisplayRef = useTemplateRef<any>("videoDisplayRef");

// Local State
const savedRange = ref<Range | null>(null);
const isSelectingEmoji = ref(false);
const textMode = ref<"normal" | "edit" | "reply">("normal");
const editingMessageData = ref<ExtendedMessage | null>(null);
const replyingToMessageData = ref<ExtendedMessage | null>(null);
const messageText = ref("");
const secondaryMessageType = ref<"video" | "voice">("voice");
const showMobileEmojiPicker = ref(false);

// Computed
const inputWidth = computed(() => rootElements.value?.clientWidth || 0);

const inputDisabled = computed(() => !props.isActive);
const inputPlaceholder = computed(() =>
  props.isActive ? t("chat.placeholder") : t("chat.chatLocked"),
);
const iconClass = computed(() =>
  !props.isActive
    ? "pointer-events-none fill-on-surface opacity-50"
    : "pointer-events-auto fill-on-surface opacity-100",
);

const secondaryMessageIcon = computed(() =>
  secondaryMessageType.value === "voice" ? "PhMicrophone" : "PhCamera",
);

const displayedActionText = computed(() => {
  const message =
    textMode.value === "edit"
      ? editingMessageData.value
      : replyingToMessageData.value;
  if (!message) return "";
  if (message.voiceUrl?.trim()) return t("chat.attachementTypes.voice");
  if (message.videoUrl?.trim()) return t("chat.attachementTypes.video");
  if (message.imageUrl?.length) return t("chat.attachementTypes.image");
  if (message.fileUrl?.trim()) return t("chat.attachementTypes.file");
  return message.text;
});

const displayActionName = computed(() => {
  if (textMode.value === "edit") return t("chat.you");
  if (replyingToMessageData.value?.senderId === chatStore.currentUserId)
    return t("chat.you");
  return replyingToMessageData.value?.contact?.name || "";
});

// --- Recording Composable ---
const recording = useChatRecording(inputWidth, {
  onStart: () => {
    if (secondaryMessageType.value === "video") videoDisplayRef.value?.open();
  },
  onCancel: () => {
    if (secondaryMessageType.value === "video") videoDisplayRef.value?.close();
  },
  onSend: (mediaUrl?: string) => {
    const finalUrl = mediaUrl || "placeholder";
    const msg = createBaseMessage();
    msg.type = secondaryMessageType.value as Message["type"];
    if (msg.type === "voice") msg.voiceUrl = finalUrl;
    if (msg.type === "video") msg.videoUrl = finalUrl;

    messagesStore.sendMessage([msg]);
    messagesStore.clearActions();
    if (secondaryMessageType.value === "video") videoDisplayRef.value?.close();
  },
  requestPermission: async () => await ensurePermissions(),
});

// Destructure recording state for template readability
const {
  isRecording,
  isLocked,
  isPaused,
  dragOffset,
  formattedTime,
  isLongPress,
  onPointerDown: onRecordPointerDown,
  stopRecording,
  mediaStream,
  lockOpacity,
  cancelOpacity,
} = recording;

const currentRecordingSeconds = computed(() => {
  if (!formattedTime.value) return 0;
  const [minutes, seconds] = formattedTime.value.split(":").map(Number);
  return minutes * 60 + (seconds || 0);
});

watch(currentRecordingSeconds, (sec) => {
  if (sec >= 60 && isRecording.value) {
    stopRecording(true); // true = send
  }
});

// --- Permissions ---
const ensurePermissions = async () => {
  const isVideo = secondaryMessageType.value === "video";
  const currentStatus = await checkMediaStatus();
  const status = isVideo ? currentStatus.cam : currentStatus.mic;

  if (status === "granted") return true;

  const state: PopupState = isVideo
    ? status === "denied"
      ? "cam-error"
      : "cam-permission"
    : status === "denied"
      ? "mic-error"
      : "mic-permission";

  return await requestWithPopup(state);
};

// --- Message Handling ---
const createBaseMessage = (): Message => {
  return {
    id: String(Date.now() + Math.floor(Math.random() * 1000)),
    conversationId: chatStore.activeConversationId ?? "",
    date: new Date(),
    type: "text",
    isEdited: false,
    senderId: chatStore.currentUserId,
    isSent: false,
    isRead: false,
    repliedTo: messagesStore.replyingTo || undefined,
  } as Message;
};

const handleAttachments = (payloads: Message[]) => {
  const newMessages = payloads.map((payload) => {
    const msg = createBaseMessage();
    msg.type = payload.type;
    if (payload.type === "text") msg.text = payload.text;
    if (payload.type === "image") msg.imageUrl = payload.imageUrl;
    if (payload.type === "file") msg.fileUrl = payload.fileUrl;
    if (payload.type === "voice") msg.voiceUrl = payload.voiceUrl;
    if (payload.type === "video") msg.videoUrl = payload.videoUrl;
    return msg;
  });

  messagesStore.sendMessage(newMessages);
  messageText.value = "";
  messagesStore.clearActions();
};

const sendMessage = () => {
  if (messageText.value.trim().length === 0) return;

  if (textMode.value === "edit" && editingMessageData.value) {
    messagesStore.saveEditMessage(
      editingMessageData.value.id,
      messageText.value,
    );
  } else {
    const msg = createBaseMessage();
    msg.type = "text";
    msg.text = messageText.value;
    messagesStore.sendMessage([msg]);
  }

  messageText.value = "";
  if (inputRef.value) inputRef.value.innerHTML = "";
  textMode.value = "normal";
  messagesStore.clearActions();
  nextTick(() => adjustHeight());
};

const cancelAction = () => {
  messagesStore.clearActions();
};

const handleEditMessage = (msg: ExtendedMessage) => {
  textMode.value = "edit";
  editingMessageData.value = msg;
  messageText.value = msg.text || "";
  nextTick(() => {
    inputRef.value?.focus();
    adjustHeight();
  });
};

// --- Watchers ---

const offEditBus = () => messagesStore.editBus.off(handleEditMessage);

watch(
  () => messagesStore.replyingTo,
  (msg) => {
    if (msg) {
      textMode.value = "reply";
      replyingToMessageData.value = msg;
      nextTick(() => inputRef.value?.focus());
    } else if (textMode.value === "reply") {
      textMode.value = "normal";
      replyingToMessageData.value = null;
    }
  },
);

// --- Input Interactions ---
const adjustHeight = () => {
  if (!inputRef.value) return;
  inputRef.value.style.height = "auto";
  inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
};

const saveCursorPosition = () => {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && inputRef.value) {
    if (inputRef.value.contains(selection.anchorNode)) {
      savedRange.value = selection.getRangeAt(0).cloneRange();
    }
  }
};

const onInputFocus = () => {
  if (isSelectingEmoji.value) return;
  showMobileEmojiPicker.value = false;
};

const handleEnterKey = (e: KeyboardEvent) => {
  if (e.shiftKey) return;
  e.preventDefault();
  sendMessage();
};

const handleContentInput = () => {
  if (!inputRef.value) return;
  let rawText = "";

  inputRef.value.childNodes.forEach((node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      rawText += node.textContent;
    } else if (node.nodeName === "IMG") {
      rawText += (node as HTMLImageElement).alt;
    } else if (node.nodeName === "DIV" || node.nodeName === "BR") {
      rawText += "\n";
    }
  });
  messageText.value = rawText;
  adjustHeight();
};

const toggleMobileEmoji = () => {
  showMobileEmojiPicker.value = !showMobileEmojiPicker.value;
  if (showMobileEmojiPicker.value) {
    saveCursorPosition();
    inputRef.value?.blur();
  }
};

const handleEmojiSelect = (emoji: string) => {
  isSelectingEmoji.value = true;
  if (!inputRef.value) return;

  inputRef.value.focus();

  const selection = window.getSelection();
  let range;

  if (savedRange.value) {
    range = savedRange.value;
    selection?.removeAllRanges();
    selection?.addRange(range);
  } else {
    range = document.createRange();
    range.selectNodeContents(inputRef.value);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  range.deleteContents();

  const parsed = parseEmojiArray(emoji);
  if (parsed.length > 0 && parsed[0].type === "emoji") {
    const chunk = parsed[0];
    const img = document.createElement("img");
    img.src = `/emojis/apple/webp/${chunk.hex}.webp`;
    img.alt = chunk.content;
    img.className =
      "inline-block h-5 w-5 mx-0.5 align-middle select-text pointer-events-none";

    range.insertNode(img);
    range.setStartAfter(img);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);

    savedRange.value = range.cloneRange();
  }

  handleContentInput();

  nextTick(() => {
    if (showMobileEmojiPicker.value) {
      inputRef.value?.blur();
    }
    adjustHeight();
  });
  isSelectingEmoji.value = false;
};

const handlePointerDown = (event: PointerEvent) => {
  if (messageText.value.trim().length > 0) {
    sendMessage();
    return;
  }
  menuRef.value?.close();
  onRecordPointerDown(event);
};

const toggleSecondaryMessageType = () => {
  if (!isLongPress.value && !isRecording.value) {
    secondaryMessageType.value =
      secondaryMessageType.value === "voice" ? "video" : "voice";
  }
};

const togglePause = () => {
  // Assuming useChatRecording has a togglePause, if not, this is a placeholder
  console.warn("Toggle pause requested");
};

const handleFlipCamera = () => {
  if (typeof recording.toggleCamera === "function") {
    recording.toggleCamera();
  }
};

const sendRecording = () => stopRecording(true);
const cancelRecording = () => stopRecording(false);

// --- Global Keys ---
const handleEscapeNavigation = () => {
  const isCallMode = callStore.isActive && !callStore.isPiP;
  const isProfileView = chatStore.profileViewOpen;

  if (isCallMode) {
    callStore.minimize();
  } else if (isProfileView) {
    chatStore.closeProfile();
  } else {
    chatStore.setSelectedChat(null);
  }
};

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    if (textMode.value !== "normal" || messagesStore.selectedArray.length > 0) {
      cancelAction();
    } else {
      handleEscapeNavigation();
    }
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleGlobalKeyDown);
});

onUnmounted(() => {
  offEditBus();
  window.removeEventListener("keydown", handleGlobalKeyDown);
});

// Expose for parent components
defineExpose({
  focus: () => inputRef.value?.focus(),
});
</script>
